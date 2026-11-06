# Product Requirements Document (PRD) - FlowCheck

## 1. Executive Summary
**FlowCheck** adalah local CLI web tool developer-centric yang menggabungkan visualisasi diagram arsitektur interaktif (node graph) dengan load testing engine real-time HTTP. 
Pengguna cukup menjalankan perintah CLI tunggal (`flowcheck`) di direktori proyek manapun, maka browser akan otomatis terbuka di `http://localhost:4000`. Pengguna dapat memodelkan topologi layanan sistem mereka (Client → API Gateway → Server → Database → Microservice), mengonfigurasi parameter load test pada endpoint tertentu, dan melihat aliran request secara visual lewat partikel animasi garis edgewise serta indikator kesehatan node yang berubah dinamis.

---

## 2. Problem Statement & User Pain Points
1. **Load Testing Tools Terlalu Terisolasi dari Topologi**: Tools seperti Apache Bench (`ab`), `k6`, atau `autocannon` memberikan metrik terminal mentah tanpa visualisasi hubungan antar-komponen dalam topologi backend.
2. **Setup Berat & Konfigurasi Berbelit**: Menyiapkan Postman, JMeter, atau Grafana k6 dashboard membutuhkan setup environment kompleks, akun cloud, atau build tools yang memakan waktu.
3. **Kurangnya Feedback Visual Real-time**: Developer sulit mendemonstrasikan bottleneck alur request kepada stakeholder atau rekan tim secara intuitif.

---

## 3. Product Vision & Goals
- **Zero Configuration**: Cukup Node.js di mesin lokal. Satu perintah CLI langsung menyalakan server lokal dan membuka UI browser.
- **Zero Build Step**: Frontend merupakan single-file `index.html` murni menggunakan React, React Flow, dan Tailwind CSS via CDN.
- **Real-Time Visual Feedback**: Aliran paket data divisualisasikan via animated dots di edge canvas; node status berubah warna dinamis (Idle, Healthy, Warning, Overloaded) berdasarkan hitungan live success rate.
- **Safe & Non-blocking Load Engine**: Batch async engine yang efisien tanpa memblokir Express event loop bahkan saat 1.000 request dengan concurrency 50.
- **Portabilitas & Local Persistence**: Konfigurasi diagram dan target tersimpan otomatis dalam file lokal `flowcheck.config.json` di direktori aktif user.

---

## 4. Target Users
- Backend Engineers & API Developers yang ingin melakukan stress test cepat pada endpoint lokal atau staging.
- System Architects yang ingin memvisualisasikan data flow sistem sekaligus menguji resiliensi endpoint.
- DevOps & Fullstack Developers yang membutuhkan tool demonstrasi performa endpoint ringan tanpa dependensi berat.

---

## 5. Core Features & Functional Requirements

### 5.1 CLI Launcher (`bin/flowcheck.js`)
- Menjalankan local Express server di port 4000 (fallback port jika bentrok).
- Otomatis meluncurkan default browser ke `http://localhost:4000`.
- Membaca dan memuat `flowcheck.config.json` di `process.cwd()` jika file sudah tersedia saat inisialisasi.
- Menampilkan banner terminal informatif dan panduan shortcut (Ctrl+C untuk berhenti).

### 5.2 Flow Canvas (Left Area ~70%)
- **Canvas Interaktif**: Draggable nodes, multi-selection, pan, dan smooth zoom menggunakan React Flow.
- **Node Types**:
  - `Client` (Inisiator request / frontend mock)
  - `API` (API Gateway / Reverse Proxy)
  - `Server` (Application Server / Microservice)
  - `Database` (PostgreSQL, Redis, Mongo, dll.)
  - `Service` (Third-party integrations, Auth provider, Payment gateway)
- **Komponen Node Display**:
  - Custom label / Node Name
  - Badge tipe node
  - Hit counter live (jumlah request yang melewati atau ditargetkan ke node)
  - Badge status: `Idle` (abu-abu), `Healthy` (>90% success, hijau), `Warning` (50–90% success, kuning), `Overloaded` (<50% success, merah)
- **Animated Edges**:
  - Aliran partikel titik (*animated dots*) menyusuri kurva edge dari node sumber ke target saat load test sedang berlangsung.
  - Animasi berhenti seketika ketika load test selesai atau dihentikan user (`Stop`).

### 5.3 Control Panel (Right Area ~30%)
- **Environment Input**: Base URL input (misal `http://localhost:8000`).
- **Graph Editing Controls**:
  - Modal [Add Node]: Nama (wajib), Tipe (dropdown), Endpoint URL (opsional, target test).
  - Modal/Dropdown [Add Edge]: Memilih Source Node dan Target Node.
  - Tombol [Delete Selected]: Menghapus node atau edge yang sedang disorot.
- **Load Test Configuration**:
  - Target Node Selector (dropdown berisi node yang memiliki konfigurasi Endpoint URL).
  - Presets Total Requests: Tombol cepat `100`, `500`, `1000` + Custom input field.
  - Concurrency Selector: Tombol cepat `1`, `10`, `50`.
  - Tombol [Run Test] (indikator loading) dan tombol [Stop] (abrupt cancel).
- **Test Metrics & Results Summary**:
  - Total Requests, Success Count, Failed Count, Average Response Time (ms), Requests per Second (RPS).
- **Persistence Controls**:
  - Tombol [Save Flow] (POST ke `/api/config/save`).
  - Tombol [Load Flow] (GET dari `/api/config/load`).

### 5.4 Stats Bar (Top Bar)
- Tampilan status real-time dengan interval polling 300ms:
  `{sent} requests sent · avg {avgResponseTime}ms · {successRate}% success · {rps} req/s`
- Status pill: Ready / Running / Completed / Aborted.

---

## 6. User Journey
1. **Startup**: Developer membuka terminal di root repo mereka dan mengetik `flowcheck`.
2. **Inspection**: Browser terbuka otomatis menampilkan FlowCheck canvas dengan diagram default atau diagram tersimpan sebelumnya.
3. **Modeling**: Developer menambahkan node `Client`, `API`, dan `Server`, menghubungkan ketiganya dengan edge, serta memasukkan endpoint URL `http://localhost:8000/api/v1/health` pada node API.
4. **Execution**: Developer memilih node target, concurrency 10, total request 500, lalu mengklik **Run Test**.
5. **Observation**: Dots mulai mengalir cepat di sepanjang edge, stats bar terupdate tiap 300ms, hit counter node naik, dan border node berganti warna sesuai status kesehatan respons HTTP.
6. **Summary & Save**: Test selesai dalam 3 detik, summary scorecard muncul, dan developer mengklik **Save Flow** untuk menyimpan topologi ke `flowcheck.config.json`.
