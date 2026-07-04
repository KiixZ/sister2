# Distributed AI Chat (Sister-2)

Aplikasi *chat* cerdas berbasis arsitektur *microservices* sederhana. Proyek ini memisahkan tugas antara **API Gateway** (mengelola otentikasi & statik file) dan **AI Service** (mengelola LLM Google Gemini & riwayat percakapan), serta didukung oleh database **MySQL**.

## 🚀 Fitur Utama
- **Autentikasi Pengguna:** Pendaftaran dan *login* pengguna sederhana dengan perlindungan `X-API-KEY`.
- **Percakapan Interaktif (AI):** Mengobrol secara pintar dan natural dengan bantuan model **Google Generative AI (Gemini 2.5 Flash)**.
- **Manajemen Memori Sesi:** Obrolan disimpan dan dipisahkan per *session_id* sehingga AI mampu mengingat riwayat percakapan spesifik dalam satu sesi tersebut.
- **Swagger UI:** Dokumentasi API interaktif *built-in* pada API Gateway.

## 📋 Prasyarat
Untuk menjalankan aplikasi ini secara lokal, pastikan sistem Anda telah terpasang:
- **Node.js** (versi 18.x direkomendasikan)
- **MySQL Server** (bisa dijalankan langsung di mesin lokal atau melalui Docker)
- API Key valid dari **Google AI Studio** (Gemini API)

## 🛠 Pengaturan (Setup)
1. Buka direktori proyek (jika Anda belum berada di dalamnya).
2. Buat sebuah database MySQL kosong dengan nama `chat_db`. Skema (tabel) akan dibuat **secara otomatis** ketika *services* pertama kali dijalankan.
3. Modifikasi atau buat file `.env` di direktori *root* proyek. Masukkan *credentials* sesuai lingkungan Anda:

```env
# Google Gemini
GEMINI_API_KEY="masukkan_api_key_gemini_anda_di_sini"

# Database Configuration (Sesuaikan jika berbeda)
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="chat_db"
```
*(Catatan: Jika dijalankan di dalam lingkungan Docker Compose murni bersama kontainer db, `DB_HOST` secara default adalah `db` pada source code.)*

## 💻 Menjalankan Aplikasi

Anda dapat memilih untuk menjalankan aplikasi menggunakan Docker atau langsung via Node.js (Lokal).

### Cara 1: Menjalankan Secara Lokal (Manual)

1. Pasang semua dependensi (*node_modules*) untuk kedua *service*.
   ```bash
   # Di direktori root
   cd api-gateway
   npm install
   
   cd ../ai-service
   npm install
   cd ..
   ```

2. Jalankan kedua *services*. Anda dapat menjalankannya di dua terminal yang berbeda:
   - Terminal 1 (API Gateway): `cd api-gateway && node index.js`
   - Terminal 2 (AI Service): `cd ai-service && node index.js`
   
   Atau menggunakan *package* global seperti `concurrently` dari direktori *root*:
   ```bash
   npm install -g concurrently
   concurrently "cd api-gateway && node index.js" "cd ai-service && node index.js"
   ```

3. Buka browser dan akses aplikasi melalui: **http://localhost:7000**

### Cara 2: Menjalankan Menggunakan Docker

Repositori ini telah menyediakan `Dockerfile` yang secara otomatis meng-install dependensi dan mengkonfigurasi `concurrently` untuk menjalankan *API Gateway* dan *AI Service* secara paralel dalam 1 *container*.

1. *Build* Image Docker:
   ```bash
   docker build -t sister-chat-app .
   ```

2. Jalankan Kontainer (pastikan menyesuaikan alamat IP `DB_HOST` pada `.env` agar kontainer Docker bisa mengakses database MySQL di OS Host Anda - atau gunakan `--network="host"`):
   ```bash
   docker run -p 7000:7000 --env-file .env sister-chat-app
   ```

## 📖 Dokumentasi

Untuk membaca penjelasan lebih dalam mengenai sistem ini, silakan telusuri file-file dokumentasi berikut yang dapat ditemukan di panel dokumen proyek Anda:
- 🏗 **Arsitektur Sistem** (`architecture_diagram.md`) - Interaksi masing-masing *microservices*.
- 🌐 **Spesifikasi API** (`api_documentation.md`) - Daftar URL dan I/O dari sistem *backend*. 
  *(Anda juga dapat mengakses UI interaktif Swagger melalui rute `http://localhost:7000/api-docs` setelah aplikasi berjalan).*
