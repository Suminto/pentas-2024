#!/usr/bin/env python3
"""
======================================================================
 KOMPRES FOTO BATCH - Year Book Alumni SMP BPK Penabur 2024
======================================================================

Script ini akan:
1. Membaca semua foto dari folder INPUT (termasuk di dalam subfolder,
   misalnya subfolder per kategori: wisuda/, study-tour/, dll)
2. Resize foto agar lebar maksimal sesuai pengaturan (default 1200px)
3. Kompres & convert ke format WebP (ukuran jauh lebih kecil, kualitas
   tetap bagus, dan didukung semua browser modern)
4. Simpan hasilnya ke folder OUTPUT dengan struktur folder yang sama
   seperti input, siap di-upload ke repo GitHub / Decap CMS

CARA PAKAI:
1. Pastikan Python 3 sudah terinstall
2. Install library Pillow (sekali saja):
       pip install Pillow

3. Taruh semua foto asli di dalam folder "foto_asli"
   (boleh dikelompokkan per subfolder, misal:
       foto_asli/wisuda/foto1.jpg
       foto_asli/study-tour/foto2.jpg
   )

4. Jalankan:
       python kompres_foto.py

5. Hasil kompresi otomatis muncul di folder "foto_kompres"
   dengan struktur folder yang sama

Bisa juga dijalankan dengan folder custom:
       python kompres_foto.py --input foto_asli --output foto_kompres --width 1200 --quality 80

======================================================================
"""

import os
import sys
import argparse
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    print("Library Pillow belum terinstall.")
    print("Silakan install dulu dengan perintah:")
    print("    pip install Pillow")
    sys.exit(1)

# Format foto yang akan diproses
EKSTENSI_DIDUKUNG = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".heic"}


def format_ukuran(byte_size):
    """Ubah ukuran byte menjadi format yang mudah dibaca (KB/MB)."""
    for satuan in ["B", "KB", "MB", "GB"]:
        if byte_size < 1024:
            return f"{byte_size:.1f} {satuan}"
        byte_size /= 1024
    return f"{byte_size:.1f} TB"


def kompres_satu_foto(path_asal, path_tujuan, lebar_maks, kualitas):
    """Kompres satu file foto: resize + convert ke WebP."""
    try:
        with Image.open(path_asal) as img:
            # Perbaiki orientasi foto dari HP (rotasi otomatis dari EXIF)
            img = ImageOps.exif_transpose(img)

            # Convert ke RGB dulu (WebP tidak butuh mode CMYK/P, dsb)
            if img.mode in ("RGBA", "LA"):
                # Pertahankan transparansi kalau ada (misal PNG logo)
                img = img.convert("RGBA")
            else:
                img = img.convert("RGB")

            # Resize kalau lebar foto melebihi batas maksimal
            if img.width > lebar_maks:
                rasio = lebar_maks / img.width
                tinggi_baru = int(img.height * rasio)
                img = img.resize((lebar_maks, tinggi_baru), Image.LANCZOS)

            # Pastikan folder tujuan ada
            path_tujuan.parent.mkdir(parents=True, exist_ok=True)

            # Simpan sebagai WebP
            img.save(path_tujuan, "WEBP", quality=kualitas, method=6)

        ukuran_asal = os.path.getsize(path_asal)
        ukuran_baru = os.path.getsize(path_tujuan)
        return True, ukuran_asal, ukuran_baru

    except Exception as e:
        return False, 0, 0, str(e)


def main():
    parser = argparse.ArgumentParser(
        description="Kompres batch foto untuk Year Book Alumni (JPG/PNG -> WebP)"
    )
    parser.add_argument("--input", default="foto_asli", help="Folder foto asli (default: foto_asli)")
    parser.add_argument("--output", default="foto_kompres", help="Folder hasil kompres (default: foto_kompres)")
    parser.add_argument("--width", type=int, default=1200, help="Lebar maksimal foto dalam pixel (default: 1200)")
    parser.add_argument("--quality", type=int, default=80, help="Kualitas WebP 1-100 (default: 80, disarankan 75-85)")
    args = parser.parse_args()

    folder_input = Path(args.input)
    folder_output = Path(args.output)

    if not folder_input.exists():
        print(f"Folder '{folder_input}' tidak ditemukan.")
        print(f"Silakan buat folder '{folder_input}' dan taruh foto-foto di dalamnya.")
        sys.exit(1)

    # Cari semua file foto di dalam folder input (termasuk subfolder)
    daftar_foto = [
        p for p in folder_input.rglob("*")
        if p.is_file() and p.suffix.lower() in EKSTENSI_DIDUKUNG
    ]

    if not daftar_foto:
        print(f"Tidak ada foto ditemukan di folder '{folder_input}'.")
        print(f"Format yang didukung: {', '.join(sorted(EKSTENSI_DIDUKUNG))}")
        sys.exit(1)

    print("=" * 60)
    print(f"  Ditemukan {len(daftar_foto)} foto untuk dikompres")
    print(f"  Lebar maksimal : {args.width}px")
    print(f"  Kualitas WebP  : {args.quality}")
    print("=" * 60)
    print()

    total_asal = 0
    total_baru = 0
    berhasil = 0
    gagal = 0

    for i, path_foto in enumerate(daftar_foto, start=1):
        # Path relatif terhadap folder input, dipertahankan strukturnya di output
        path_relatif = path_foto.relative_to(folder_input)
        path_tujuan = folder_output / path_relatif.with_suffix(".webp")

        hasil = kompres_satu_foto(path_foto, path_tujuan, args.width, args.quality)

        if hasil[0]:
            _, ukuran_asal, ukuran_baru = hasil
            total_asal += ukuran_asal
            total_baru += ukuran_baru
            berhasil += 1
            hemat = (1 - ukuran_baru / ukuran_asal) * 100 if ukuran_asal > 0 else 0
            print(f"[{i}/{len(daftar_foto)}] OK   {path_relatif}  "
                  f"({format_ukuran(ukuran_asal)} -> {format_ukuran(ukuran_baru)}, hemat {hemat:.0f}%)")
        else:
            gagal += 1
            error_msg = hasil[3] if len(hasil) > 3 else "unknown error"
            print(f"[{i}/{len(daftar_foto)}] GAGAL {path_relatif}  -> {error_msg}")

    print()
    print("=" * 60)
    print("  SELESAI")
    print(f"  Berhasil : {berhasil} foto")
    print(f"  Gagal    : {gagal} foto")
    if total_asal > 0:
        total_hemat = (1 - total_baru / total_asal) * 100
        print(f"  Ukuran total sebelum : {format_ukuran(total_asal)}")
        print(f"  Ukuran total sesudah : {format_ukuran(total_baru)}")
        print(f"  Total penghematan    : {total_hemat:.0f}%")
    print(f"  Hasil disimpan di folder: {folder_output}/")
    print("=" * 60)


if __name__ == "__main__":
    main()
