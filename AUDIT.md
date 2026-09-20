# Audit Modul dan Prioritas Perbaikan

Audit ini menilai alur yang benar-benar tersedia di aplikasi: pengambilan URL, impor HTML/CSV, ekstraksi dan klasifikasi email, deduplikasi, persetujuan, suppression, penyimpanan lokal, serta ekspor. Prioritas memakai skala **P0 → P3 → Polish**.

## Ringkasan eksekutif

| Prioritas | Temuan | Status |
| --- | --- | --- |
| P0 | Penulisan ulang seluruh IndexedDB dapat selesai tidak berurutan dan mengembalikan data lama setelah perubahan yang lebih baru. | **Diperbaiki** dengan antrean penyimpanan dan snapshot. |
| P0 | Nilai ekspor CSV yang diawali `=`, `+`, `-`, atau `@` dapat dieksekusi sebagai formula ketika dibuka di spreadsheet. | **Diperbaiki** dengan formula escaping. |
| P1 | `fetch` tidak memiliki timeout; satu server yang menggantung dapat menahan seluruh batch dan tombol tetap dalam keadaan processing. | **Diperbaiki** dengan abort 15 detik dan `finally`. |
| P1 | Semua kegagalan HTTP, tipe konten, ukuran, dan timeout sebelumnya dilabeli “Blocked by CORS”, sehingga diagnosis salah. | **Diperbaiki** dengan status “Retrieval failed”; kegagalan jaringan browser tetap memakai status CORS. |
| P1 | Memilih klasifikasi “Do Not Contact” secara manual tidak memasukkan email ke suppression list; tombol cepat juga membiarkan dialog lama terbuka sehingga perubahan dapat tertimpa. | **Diperbaiki** pada kedua jalur dan dialog ditutup setelah suppression. |
| P2 | Kolom `profile_url` diterima parser CSV tetapi dibuang dari model, UI, dan ekspor. | **Diperbaiki** end-to-end. |
| P2 | Ekstraktor menganggap elemen dengan inline `display:none` / `visibility:hidden` sebagai teks terlihat. | **Diperbaiki** dan diuji. |
| Polish | Dialog belum menahan fokus keyboard dan halaman belakang masih dapat di-scroll. | **Diperbaiki** dengan focus loop, pemulihan fokus, dan scroll lock. |

Setelah perbaikan ini tidak ditemukan blocker P0 yang masih terbuka pada lingkup frontend saat ini. Build TypeScript/Vite dan seluruh unit test lulus. Namun, aplikasi tetap mempunyai batasan produk yang disengaja dan beberapa pekerjaan lanjutan di bawah.

## Analisis per modul

### 1. `App.tsx` — orkestrasi workflow

**Yang berfungsi**

- Otorisasi wajib untuk pengambilan URL dan impor file.
- URL dibatasi maksimal 25, hanya HTTP(S), diproses satu per satu, dan tidak melakukan crawling.
- Impor HTML dibatasi 5 MB; CSV dibatasi 2 MB.
- Hanya data berstatus `Approved`, valid, dan bukan DNC yang diekspor.
- Filter, pencarian, data demo, notifikasi, manual entry, delete, dan clear data terhubung.

**Perbaikan audit**

- Request kini berhenti setelah 15 detik agar batch tidak menggantung tanpa batas.
- HTTP non-2xx, respons bukan HTML, ukuran berlebih, dan timeout tidak lagi disalahartikan sebagai CORS.
- Status processing selalu di-reset melalui `finally`.
- Jalur DNC sekarang konsisten antara tombol cepat dan penyuntingan klasifikasi.
- `profile_url` dari CSV/manual entry dipertahankan, ditampilkan, dicari, dan diekspor.

**Pekerjaan lanjutan (P2/P3)**

- Status sumber hanya hidup selama sesi; bila histori proses perlu dipertahankan, buat object store terpisah dan kebijakan retensi.
- Detail record saat ini hanya dapat mengubah klasifikasi, status, dan catatan. Tambahkan mode edit penuh bila koreksi nama/program/institusi diperlukan setelah impor.
- Proses URL masih serial. Ini aman untuk beban kecil, tetapi concurrency terbatas (misalnya 2–3 request) dapat meningkatkan UX tanpa menjadi crawler.
- Tidak ada tombol membatalkan batch secara eksplisit; saat ini timeout hanya membatalkan request yang macet.

### 2. `utils/email.ts` — normalisasi, validasi, ekstraksi, klasifikasi

**Yang berfungsi**

- Email dinormalisasi ke lowercase dan query pada `mailto:` dibuang.
- Validator mengharuskan domain bertitik dan menolak bentuk yang jelas tidak valid.
- Alamat free-mail dan local-part generik ditandai untuk review.
- Script, style, navigasi, footer, aside, elemen hidden/ARIA-hidden, dan inline-hidden tidak diekstrak.
- Deduplikasi mempertahankan kumpulan URL sumber.

**Batasan yang disengaja**

- Tidak mendekode email yang di-obfuscate, tidak menebak pola, dan tidak mencari alamat dari halaman lain.
- CSS dari stylesheet eksternal tidak dapat dinilai secara andal pada dokumen yang hanya diparse dan tidak dirender. Inline hidden sudah ditangani, tetapi class seperti `.hidden` bergantung pada stylesheet halaman.
- Nama/role tidak diinferensikan dari evidence; ini menekan false attribution tetapi menyisakan pekerjaan review manual.

**Pekerjaan lanjutan (P2)**

- Deduplikasi mengubah klasifikasi record tunggal menjadi `Duplicate`; akibatnya klasifikasi domain asli tidak lagi tersedia sebagai field terstruktur. Model yang lebih bersih adalah menyimpan `duplicate_count`/`duplicate_sources` terpisah dan mempertahankan klasifikasi asli.
- Daftar provider free-mail dan generic local-part bersifat statis dan belum dilokalkan.

### 3. `utils/csv.ts` — impor dan ekspor

**Yang berfungsi**

- BOM, header case/whitespace, quoted commas, baris kosong, dan error parser ditangani.
- `professional_email` diwajibkan sebagai header.
- Semua kolom yang didokumentasikan, termasuk `profile_url`, sekarang round-trip.
- Formula berbahaya di-escape saat ekspor untuk mengurangi CSV/spreadsheet injection.

**Pekerjaan lanjutan (P2/P3)**

- Parser menerima baris dengan email kosong/tidak valid lalu mengirimnya ke review. Pertimbangkan ringkasan “imported/skipped/invalid” sebelum commit agar pengguna dapat memilih kebijakan strict.
- Belum ada deteksi duplicate header atau pelaporan nomor baris per masalah.

### 4. `storage/db.ts` — IndexedDB

**Yang berfungsi**

- Data disimpan lokal dan database ditutup pada success/error/abort.
- Save kini diantrikan dan memakai snapshot sehingga commit lama tidak dapat menimpa state baru.
- Kegagalan satu save tidak mematikan antrean save berikutnya.

**Pekerjaan lanjutan (P1/P2)**

- Belum ada unit/integration test IndexedDB. Tambahkan `fake-indexeddb` untuk menguji upgrade, kegagalan transaksi, urutan save, dan load kembali.
- Skema masih versi 1 tanpa migrasi eksplisit. Field opsional aman untuk data lama, tetapi perubahan model besar berikutnya harus menaikkan versi dan memiliki migrasi.
- Clear data menghapus record, tetapi suppression list sengaja tetap ada. UX sebaiknya menjelaskan perbedaan ini atau menyediakan aksi terpisah “reset suppression list”.

### 5. Komponen UI

- `SourcePanel`: seluruh callback utama terhubung; file input dapat memilih ulang file yang sama.
- `ResultsTable`: empty state, horizontal overflow, badge, dan tombol detail berfungsi.
- `Modal`: Escape, klik backdrop, label dialog, focus loop, focus restore, dan scroll lock tersedia.
- `ErrorBoundary`: mencegah white screen dan menjelaskan bahwa data lokal tetap ada.

**Pekerjaan polish**

- Tambahkan pengujian interaksi dengan React Testing Library untuk keyboard dialog, upload, filter, approval, dan export gating.
- Tambahkan `aria-live` pada status batch dan indikator status berbasis warna yang juga memakai ikon/teks konsisten.
- Jadikan profile URL sebagai link tervalidasi pada detail, bukan sekadar teks.
- Pertimbangkan virtualisasi/pagination jika jumlah record lokal tumbuh menjadi ribuan.

## Batasan arsitektur, bukan bug

1. **CORS:** frontend tidak dapat mengambil banyak situs institusi tanpa izin CORS. File import adalah fallback resmi; proxy/bypass sengaja tidak disediakan.
2. **Tidak ada crawling/search:** hanya URL yang diberikan pengguna yang diproses. Ini menjaga scope dan mengurangi risiko abuse.
3. **Local-only:** data terikat pada browser profile dan dapat hilang ketika site data dibersihkan. Ekspor adalah mekanisme backup.
4. **Tidak ada verifikasi mailbox:** aplikasi memvalidasi bentuk dan provenance, bukan deliverability alamat.
5. **Tidak ada outreach automation:** tidak ada bulk sending, sequence, tracking, login bypass, atau enrichment.

## Rencana lanjutan yang disarankan

1. **P1:** tambah test IndexedDB dan test integrasi workflow utama.
2. **P1:** tambahkan cancel batch serta cleanup request ketika komponen unmount.
3. **P2:** pisahkan metadata duplicate dari klasifikasi email asli.
4. **P2:** tambah preview/validation report sebelum CSV import disimpan.
5. **P3:** persist histori sumber secara opsional dengan tombol clear tersendiri.
6. **Polish:** audit aksesibilitas otomatis (axe), responsive visual regression, dan UX link profile.
