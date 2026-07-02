# App Planning & Roadmap

Dokumen ini berisi catatan pengembangan, arsitektur, dan peta jalan (roadmap) untuk aplikasi AuthorGit.

## 🚀 Future Migration: Tauri
Aplikasi saat ini menggunakan arsitektur *frontend* React dan *backend* Node.js/Express. Ke depannya, *backend* Node.js ini akan diganti sepenuhnya menggunakan **Tauri (Rust)** untuk menghasilkan aplikasi desktop *native* yang lebih ringan dan aman.

### Catatan Migrasi Tauri:
1. **Penyimpanan `library.json`**:
   - **Current State**: Saat ini `library.json` disimpan di *root* direktori proyek (`../../library.json`).
   - **Tauri State**: Pada aplikasi Tauri (*production*), menulis konfigurasi di direktori instalasi akan diblokir oleh OS (karena izin/*permissions*).
   - **Solusi**: Gunakan API `tauri::api::path::app_data_dir()` di Rust. Ini akan mengarahkan penyimpanan file konfigurasi ke lokasi OS yang seharusnya secara aman:
     - Linux: `~/.config/com.authorapp.dev/library.json`
     - Windows: `%APPDATA%\com.authorapp.dev\library.json`
     - macOS: `~/Library/Application Support/com.authorapp.dev/library.json`
2. **File System Operations (`libraryService.js` & `api.js`)**:
   - Seluruh operasi manipulasi file (baca, tulis, ubah nama, hapus) yang saat ini berjalan di Express JS akan digantikan oleh **Tauri Commands** (Rust).
   - Penggunaan modul `fs` di Node akan digantikan dengan modul `std::fs` di Rust.
3. **Git Auto-Save (`gitService.js`)**:
   - Kita bisa memanfaatkan *library* `git2-rs` di Rust untuk melakukan commit, alih-alih mengeksekusi shell (`child_process.exec`). Hal ini akan jauh lebih cepat, andal, dan tidak mengharuskan pengguna menginstal `git` di mesin mereka (bergantung pada implementasi).
4. **WebSockets (`watcherService.js`)**:
   - Tauri memiliki fitur pengiriman *event* langsung dari *backend* (Rust) ke *frontend* (React) secara lokal lewat metode seperti `app.emit_all()`. Ini berarti kita tidak lagi membutuhkan *server* WebSocket (`ws`) karena protokol komunikasi bawaan Tauri jauh lebih ringan dan cepat.

## 📋 Fitur Utama yang Terselesaikan
- ✅ Tampilan desain UI premium.
- ✅ *Global Dialog* (Custom Modals) untuk interaksi Prompt, Confirm, dan Alert.
- ✅ *Time Machine* dengan diff renderer kustom.
- ✅ *Compiler* naskah otomatis per-bab dan per-buku.
- ✅ Event-driven Sidebar tree viewer update.

## 📝 Backlog & Todo
- [ ] Implementasi awal Tauri (Tahap 1: Setup Workspace Tauri CLI).
- [ ] Merombak panggilan Fetch API di *Frontend* menjadi `@tauri-apps/api/invoke`.
- [ ] Menulis ulang rute API Node.js ke Tauri Commands (Rust).
