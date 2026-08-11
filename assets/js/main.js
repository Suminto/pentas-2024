/* ======================================================================
   Year Book Alumni SMP BPK Penabur 2024
   main.js - mengambil data dari /content/*.json (dikelola lewat admin
   panel Decap CMS) dan menampilkannya secara interaktif di halaman.
   ====================================================================== */

(function () {
  "use strict";

  // Palet warna placeholder untuk foto yang belum diisi
  var PLACEHOLDER_GRADIENTS = [
    "linear-gradient(150deg,#22345C,#3C5A96)",
    "linear-gradient(150deg,#E2604A,#A6402F)",
    "linear-gradient(150deg,#C9A227,#8C6D18)",
    "linear-gradient(150deg,#6F8768,#4A5940)",
    "linear-gradient(150deg,#3C5A96,#22345C)",
    "linear-gradient(150deg,#A6402F,#E2604A)"
  ];

  function gradientFor(index) {
    return PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length];
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Ambil ID video YouTube dari berbagai format URL
  function getYoutubeId(url) {
    if (!url) return null;
    var patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
      /(?:youtu\.be\/)([^?\s]+)/,
      /(?:youtube\.com\/embed\/)([^?\s]+)/
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = url.match(patterns[i]);
      if (m && m[1]) return m[1];
    }
    return null;
  }

  function fetchJson(path) {
    return fetch(path, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("Gagal memuat " + path);
        return res.json();
      })
      .catch(function (err) {
        console.warn(err);
        return { items: [] };
      });
  }

  /* ==================== NAV MOBILE ==================== */
  function initNav() {
    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
      var expanded = links.classList.contains("open");
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
      });
    });
  }

  /* ==================== SCROLLSPY ==================== */
  function initScrollspy() {
    var sections = document.querySelectorAll("section[id]");
    var navAnchors = document.querySelectorAll("nav.links a");
    if (!sections.length || !navAnchors.length || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute("id");
            navAnchors.forEach(function (a) {
              a.classList.toggle("active", a.getAttribute("href") === "#" + id);
            });
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ==================== SETTINGS (hero teks) ==================== */
  function renderSettings(data) {
    if (!data) return;
    var judul = document.getElementById("heroTitle");
    var sub = document.getElementById("heroSub");
    var brandT2 = document.getElementById("brandSchool");
    if (judul && data.judul_web) {
      judul.innerHTML = "Kenangan yang <em>tak lekang</em><br>oleh waktu.";
    }
    if (sub && data.tagline) sub.textContent = data.tagline;
    if (brandT2 && data.nama_sekolah) brandT2.textContent = data.nama_sekolah;
  }

  /* ==================== ALUMNI ==================== */
  var alumniData = [];
  var alumniFilterKelas = "Semua";
  var alumniSearchTerm = "";

  function renderAlumniCard(item, idx) {
    var photoInner = item.foto
      ? '<img src="' + escapeHtml(item.foto) + '" alt="Foto ' + escapeHtml(item.nama) + '" loading="lazy">'
      : '<div class="polaroid-photo" style="background:' + gradientFor(idx) + '">FOTO</div>';

    var photoHtml = item.foto
      ? '<div class="polaroid-photo">' + photoInner + '</div>'
      : photoInner;

    return (
      '<div class="polaroid" data-kelas="' + escapeHtml(item.kelas || "") + '">' +
        photoHtml +
        '<div class="polaroid-info">' +
          '<div class="name">' + escapeHtml(item.nama || "Tanpa Nama") + '</div>' +
          '<div class="kelas">' + escapeHtml(item.kelas || "-") + '</div>' +
          (item.kesan ? '<div class="quote">&ldquo;' + escapeHtml(item.kesan) + '&rdquo;</div>' : '') +
        '</div>' +
      '</div>'
    );
  }

  function renderAlumniGrid() {
    var grid = document.getElementById("alumniGrid");
    if (!grid) return;

    var filtered = alumniData.filter(function (item) {
      var matchKelas = alumniFilterKelas === "Semua" || item.kelas === alumniFilterKelas;
      var matchSearch =
        !alumniSearchTerm ||
        (item.nama || "").toLowerCase().indexOf(alumniSearchTerm.toLowerCase()) !== -1;
      return matchKelas && matchSearch;
    });

    if (!filtered.length) {
      grid.innerHTML = '<div class="empty-state">Tidak ada alumni yang cocok dengan pencarian.</div>';
      return;
    }

    grid.innerHTML = filtered.map(renderAlumniCard).join("");
  }

  function initAlumni(items) {
    alumniData = items || [];
    var grid = document.getElementById("alumniGrid");
    var searchInput = document.getElementById("alumniSearch");
    var chips = document.querySelectorAll("#alumniChips .chip");

    if (searchInput) {
      searchInput.removeAttribute("disabled");
      searchInput.addEventListener("input", function (e) {
        alumniSearchTerm = e.target.value;
        renderAlumniGrid();
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        alumniFilterKelas = chip.getAttribute("data-kelas");
        renderAlumniGrid();
      });
    });

    renderAlumniGrid();
  }

  /* ==================== GALERI FOTO + LIGHTBOX ==================== */
  var galeriData = [];
  var galeriFilterKategori = "Semua";
  var lightboxIndex = 0;

  function currentGaleriFiltered() {
    return galeriData.filter(function (item) {
      return galeriFilterKategori === "Semua" || item.kategori === galeriFilterKategori;
    });
  }

  function renderMasonry() {
    var container = document.getElementById("galeriGrid");
    if (!container) return;
    var filtered = currentGaleriFiltered();

    if (!filtered.length) {
      container.innerHTML = '<div class="empty-state">Belum ada foto di kategori ini.</div>';
      return;
    }

    container.innerHTML = filtered
      .map(function (item, idx) {
        var bg = item.gambar ? "" : "background:" + gradientFor(idx) + ";min-height:190px;";
        var imgHtml = item.gambar
          ? '<img src="' + escapeHtml(item.gambar) + '" alt="' + escapeHtml(item.caption || "") + '" loading="lazy">'
          : '<div class="ph" style="' + bg + '">' + escapeHtml(item.caption || "") + '</div>';
        return (
          '<div class="mason-item" data-index="' + idx + '" tabindex="0" role="button" aria-label="Perbesar foto ' + escapeHtml(item.caption || "") + '">' +
            '<span class="overlay-tag">' + escapeHtml(item.kategori || "Umum") + '</span>' +
            '<span class="zoom-icon">&#10530;</span>' +
            imgHtml +
            (item.gambar ? '<div class="caption-bar">' + escapeHtml(item.caption || "") + '</div>' : "") +
          '</div>'
        );
      })
      .join("");

    container.querySelectorAll(".mason-item").forEach(function (el) {
      el.addEventListener("click", function () {
        openLightbox(parseInt(el.getAttribute("data-index"), 10));
      });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(parseInt(el.getAttribute("data-index"), 10));
        }
      });
    });
  }

  function renderFilterTabs() {
    var container = document.getElementById("filterTabs");
    if (!container) return;
    var kategoriSet = {};
    galeriData.forEach(function (item) {
      if (item.kategori) kategoriSet[item.kategori] = true;
    });
    var kategoriList = ["Semua"].concat(Object.keys(kategoriSet));

    container.innerHTML = kategoriList
      .map(function (kat) {
        var activeClass = kat === galeriFilterKategori ? " active" : "";
        return '<button class="chip' + activeClass + '" data-kat="' + escapeHtml(kat) + '">' + escapeHtml(kat) + '</button>';
      })
      .join("");

    container.querySelectorAll(".chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        container.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        galeriFilterKategori = chip.getAttribute("data-kat");
        renderMasonry();
      });
    });
  }

  function openLightbox(index) {
    var filtered = currentGaleriFiltered();
    if (!filtered.length) return;
    lightboxIndex = index;
    updateLightbox(filtered);
    var overlay = document.getElementById("lightboxOverlay");
    if (overlay) overlay.classList.add("open");
  }

  function updateLightbox(filtered) {
    var item = filtered[lightboxIndex];
    if (!item) return;
    var img = document.getElementById("lightboxImg");
    var cap = document.getElementById("lightboxCaption");
    if (img) {
      img.src = item.gambar || "";
      img.alt = item.caption || "";
      img.style.background = item.gambar ? "" : gradientFor(lightboxIndex);
    }
    if (cap) cap.textContent = (item.caption || "") + (item.kategori ? " — " + item.kategori : "");
  }

  function initLightbox() {
    var overlay = document.getElementById("lightboxOverlay");
    var closeBtn = document.getElementById("lightboxClose");
    var prevBtn = document.getElementById("lightboxPrev");
    var nextBtn = document.getElementById("lightboxNext");
    if (!overlay) return;

    function close() { overlay.classList.remove("open"); }

    function nav(delta) {
      var filtered = currentGaleriFiltered();
      if (!filtered.length) return;
      lightboxIndex = (lightboxIndex + delta + filtered.length) % filtered.length;
      updateLightbox(filtered);
    }

    if (closeBtn) closeBtn.addEventListener("click", close);
    if (prevBtn) prevBtn.addEventListener("click", function () { nav(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { nav(1); });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function (e) {
      if (!overlay.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") nav(-1);
      if (e.key === "ArrowRight") nav(1);
    });
  }

  function initGaleri(items) {
    galeriData = items || [];
    renderFilterTabs();
    renderMasonry();
    initLightbox();
  }

  /* ==================== GALERI VIDEO + MODAL ==================== */
  var videoData = [];

  function renderVideoGrid() {
    var container = document.getElementById("videoGrid");
    if (!container) return;

    if (!videoData.length) {
      container.innerHTML = '<div class="empty-state">Belum ada video yang ditambahkan.</div>';
      return;
    }

    container.innerHTML = videoData
      .map(function (item, idx) {
        var ytId = getYoutubeId(item.link_youtube);
        var thumbStyle = ytId
          ? 'background-image:url(https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg); background-size:cover; background-position:center;'
          : "";
        return (
          '<div class="video-card">' +
            '<div class="video-thumb" style="' + thumbStyle + '" data-index="' + idx + '" tabindex="0" role="button" aria-label="Putar video ' + escapeHtml(item.judul || "") + '">' +
              '<button class="play-btn" aria-hidden="true">&#9658;</button>' +
            '</div>' +
            '<div class="video-meta">' +
              '<div class="vt">' + escapeHtml(item.judul || "Tanpa Judul") + '</div>' +
              '<div class="vd">' + escapeHtml(item.deskripsi || "") + '</div>' +
            '</div>' +
          '</div>'
        );
      })
      .join("");

    container.querySelectorAll(".video-thumb").forEach(function (el) {
      el.addEventListener("click", function () {
        openVideoModal(parseInt(el.getAttribute("data-index"), 10));
      });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openVideoModal(parseInt(el.getAttribute("data-index"), 10));
        }
      });
    });
  }

  function openVideoModal(index) {
    var item = videoData[index];
    if (!item) return;
    var ytId = getYoutubeId(item.link_youtube);
    var overlay = document.getElementById("videoModalOverlay");
    var frame = document.getElementById("videoModalFrame");
    if (!overlay || !frame) return;

    if (ytId) {
      frame.innerHTML = '<iframe src="https://www.youtube.com/embed/' + ytId + '?autoplay=1" title="' +
        escapeHtml(item.judul || "Video") +
        '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    } else {
      frame.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;padding:20px;text-align:center;">Link video belum diisi lewat admin panel.</div>';
    }
    overlay.classList.add("open");
  }

  function initVideoModal() {
    var overlay = document.getElementById("videoModalOverlay");
    var closeBtn = document.getElementById("videoModalClose");
    var frame = document.getElementById("videoModalFrame");
    if (!overlay) return;

    function close() {
      overlay.classList.remove("open");
      if (frame) frame.innerHTML = "";
    }

    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) close();
    });
  }

  function initVideo(items) {
    videoData = items || [];
    renderVideoGrid();
    initVideoModal();
  }

  /* ==================== KESAN & PESAN ==================== */
  function renderWall(items) {
    var container = document.getElementById("wallGrid");
    if (!container) return;
    if (!items || !items.length) {
      container.innerHTML = '<div class="empty-state" style="color:var(--paper);opacity:.7;">Belum ada kesan & pesan.</div>';
      return;
    }
    container.innerHTML = items
      .map(function (item) {
        return (
          '<div class="sticky">' +
            '&ldquo;' + escapeHtml(item.pesan || "") + '&rdquo;' +
            '<span class="from">&mdash; ' + escapeHtml(item.nama || "") + (item.jabatan ? ", " + escapeHtml(item.jabatan) : "") + '</span>' +
          '</div>'
        );
      })
      .join("");
  }

  /* ==================== HERO CORKBOARD ==================== */
  function renderCorkboard(galeriItems) {
    var board = document.getElementById("corkboardPhotos");
    if (!board) return;
    var featured = (galeriItems || []).slice(0, 4);
    var positions = [
      { cls: "card-1", style: "top:10px; left:14px; width:150px; height:180px; transform:rotate(-7deg);" },
      { cls: "card-2", style: "top:4px; right:12px; width:170px; height:200px; transform:rotate(5deg);" },
      { cls: "card-3", style: "bottom:20px; left:54px; width:160px; height:190px; transform:rotate(4deg);" },
      { cls: "card-4", style: "bottom:12px; right:38px; width:145px; height:175px; transform:rotate(-5deg);" }
    ];

    var html = "";
    featured.forEach(function (item, idx) {
      var pos = positions[idx] || positions[0];
      var innerPhoto = item.gambar
        ? '<img src="' + escapeHtml(item.gambar) + '" alt="' + escapeHtml(item.caption || "") + '">'
        : '<div class="photo-fill" style="background:' + gradientFor(idx) + '">' + escapeHtml((item.kategori || "").toUpperCase()) + '</div>';
      html +=
        '<div class="pin" style="' +
          (idx % 2 === 0 ? "top:20px; left:" : "top:16px; right:") + (95 - idx * 3) + "px;" +
        '"></div>' +
        '<div class="photo-card ' + pos.cls + '" style="' + pos.style + '">' +
          innerPhoto +
          '<div class="cap">' + escapeHtml(item.caption || "") + '</div>' +
        '</div>';
    });

    // Sticky note tetap statis sebagai sentuhan personal
    html +=
      '<div class="note-sticky">Selamat menempuh jenjang baru! 🎓✨</div>';

    board.innerHTML = html;
  }

  /* ==================== INIT ==================== */
  function init() {
    initNav();
    initScrollspy();

    Promise.all([
      fetchJson("/content/settings.json"),
      fetchJson("/content/alumni.json"),
      fetchJson("/content/galeri-foto.json"),
      fetchJson("/content/galeri-video.json"),
      fetchJson("/content/kesan-pesan.json")
    ]).then(function (results) {
      var settings = results[0] || {};
      var alumni = (results[1] && results[1].items) || [];
      var galeri = (results[2] && results[2].items) || [];
      var video = (results[3] && results[3].items) || [];
      var pesan = (results[4] && results[4].items) || [];

      renderSettings(settings);
      renderCorkboard(galeri);
      initAlumni(alumni);
      initGaleri(galeri);
      initVideo(video);
      renderWall(pesan);

      var statAlumni = document.getElementById("statAlumni");
      var statFoto = document.getElementById("statFoto");
      if (statAlumni) statAlumni.textContent = alumni.length;
      if (statFoto) statFoto.textContent = galeri.length;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
