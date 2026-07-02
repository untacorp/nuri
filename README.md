# AuthorGit 🖋️

Sebuah aplikasi web lokal (*local-first*) bergaya premium yang berfungsi sebagai editor naskah cerdas. Aplikasi ini merangkai bab-bab ceritamu dari file fisik `.md` (Markdown) murni agar mudah terhubung dengan Obsidian, sambil mengamankan setiap huruf yang kamu ketik menggunakan mesin **Git**.

---

## 🚀 Cara Menjalankan Aplikasi (Native Local Mode)

Karena aplikasi ini dirancang layaknya Desktop App (agar memiliki kebebasan menyimpan folder di mana pun di dalam komputermu), kita akan menjalankannya secara *native* menggunakan Node.js tanpa Docker.

### 1. Jalankan Backend (Mesin Penyimpan & Git)
Buka terminal baru, masuk ke direktori `backend`, lalu jalankan:
```bash
cd backend
npm install
npm run dev
```
*Server belakang layar akan menyala di http://localhost:3001*

### 2. Jalankan Frontend (Antarmuka Web)
Buka terminal baru lainnya, masuk ke direktori `frontend`, lalu jalankan:
```bash
cd frontend
npm install
npm run dev
```
*Tampilan UI akan menyala. Buka browser dan kunjungi **http://localhost:5173***

---

## 💡 Fitur Kunci

* **Workspace Dashboard:** Tampilan galeri interaktif untuk manajemen koleksi bukumu.
* **Custom Vault Path:** Saat membuat buku baru, kamu bisa bebas menentukan *Absolute Path* (misal: `/home/auttomus/Documents/Obsidian/Novel_Ku`) sebagai tempat penyimpanan fisik file Markdown-mu.
* **Real-time File Explorer:** Sidebar layaknya VS Code.
* **The "Time Machine" (Git Auto-Save):** Menyimpan file `.md` sekaligus melakukan Git Commit otomatis di latar belakang untuk melindungi tulisanmu dari salah hapus.
