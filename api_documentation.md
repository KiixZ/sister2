# Dokumentasi API - Distributed AI Chat

Dokumen ini mendeskripsikan spesifikasi *endpoint* REST API yang diekspos oleh **API Gateway** (berjalan pada port `7000`).

Secara default, Gateway mengamankan *endpoint* tertentu menggunakan *header* otentikasi API Key sederhana:
- **Header:** `X-API-KEY`
- **Nilai:** String rahasia API Key yang ditentukan di server (contoh default: `my-secret-api-key` atau token yang didapat dari *login*).

> [!NOTE]
> *Endpoint* `/api/login` dan `/api/register` tidak memerlukan otentikasi API Key.

---

## 1. Otentikasi

### 1.1 Login Pengguna
- **URL:** `/api/login`
- **Method:** `POST`
- **Deskripsi:** Memverifikasi kredensial pengguna dan mengembalikan `user_id` beserta `api_key` untuk otentikasi sesi selanjutnya.
- **Request Body (JSON):**
  ```json
  {
    "username": "user123",
    "password": "password123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Login successful",
    "user_id": 1,
    "api_key": "my-secret-api-key"
  }
  ```
- **Response (401 Unauthorized):**
  ```json
  {
    "error": "Invalid username or password"
  }
  ```

### 1.2 Register Pengguna Baru
- **URL:** `/api/register`
- **Method:** `POST`
- **Deskripsi:** Mendaftarkan pengguna baru ke dalam database.
- **Request Body (JSON):**
  ```json
  {
    "username": "new_user",
    "password": "new_password"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Registration successful",
    "user_id": 2,
    "api_key": "my-secret-api-key"
  }
  ```
- **Response (400 Bad Request):**
  ```json
  {
    "error": "Username already exists"
  }
  ```

---

## 2. Percakapan AI (Chat)

### 2.1 Mengirim Pesan ke AI
- **URL:** `/api/chat`
- **Method:** `POST`
- **Headers:** `X-API-KEY: <api_key_anda>`
- **Deskripsi:** Meneruskan pesan *chat* dari pengguna ke AI Service untuk diproses oleh Google Generative AI (Gemini). Jika `session_id` tidak diberikan, sistem akan secara otomatis membuat sesi baru.
- **Request Body (JSON):**
  ```json
  {
    "user_id": 1,
    "message": "Halo AI, apa kabar?",
    "session_id": "bcf52e85-b82b-42f8-958b-03ea32959663" 
  }
  ```
  *(Catatan: `session_id` bersifat opsional pada pesan pertama).*
- **Response (200 OK):**
  ```json
  {
    "reply": "Halo! Saya baik, terima kasih. Ada yang bisa saya bantu hari ini?",
    "session_id": "bcf52e85-b82b-42f8-958b-03ea32959663",
    "history_id": 45
  }
  ```

---

## 3. Riwayat (History)

### 3.1 Mengambil Daftar Sesi Obrolan Pengguna
- **URL:** `/api/history/{userId}`
- **Method:** `GET`
- **Headers:** `X-API-KEY: <api_key_anda>`
- **Deskripsi:** Mengambil daftar riwayat percakapan unik berdasarkan `session_id` milik seorang pengguna. Digunakan untuk menampilkan daftar obrolan di *sidebar* aplikasi.
- **URL Params:** `userId=[integer]` (ID dari pengguna)
- **Response (200 OK):**
  ```json
  [
    {
      "session_id": "bcf52e85-b82b-42f8-958b-03ea32959663",
      "request_time": "2026-07-04T12:30:00.000Z",
      "request_text": "Halo AI, apa kabar?"
    }
  ]
  ```

### 3.2 Mengambil Detail Sesi Obrolan Tertentu
- **URL:** `/api/history/{userId}/session/{sessionId}`
- **Method:** `GET`
- **Headers:** `X-API-KEY: <api_key_anda>`
- **Deskripsi:** Mengambil seluruh isi percakapan (request dan response) secara berurutan dalam satu sesi obrolan (`session_id`) milik pengguna.
- **URL Params:**
  - `userId=[integer]`
  - `sessionId=[string]`
- **Response (200 OK):**
  ```json
  [
    {
      "id": 45,
      "user_id": 1,
      "request_text": "Halo AI, apa kabar?",
      "response_text": "Halo! Saya baik, terima kasih. Ada yang bisa saya bantu hari ini?",
      "request_time": "2026-07-04T12:30:00.000Z",
      "session_id": "bcf52e85-b82b-42f8-958b-03ea32959663",
      "tokens_used": 0
    },
    {
      "id": 46,
      "user_id": 1,
      "request_text": "Bisa jelaskan apa itu black hole?",
      "response_text": "Tentu, black hole atau lubang hitam adalah...",
      "request_time": "2026-07-04T12:31:00.000Z",
      "session_id": "bcf52e85-b82b-42f8-958b-03ea32959663",
      "tokens_used": 0
    }
  ]
  ```
