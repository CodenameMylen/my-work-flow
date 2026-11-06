# Software Requirements Specification (SRS) - FlowCheck

## 1. System Architecture Overview
FlowCheck dirancang sebagai hybrid single-process local server dan rich SPA client tanpa build step:
- **CLI Wrapper (`bin/flowcheck.js`)**: Executable node script dengan shebang `#!/usr/bin/env node`, menangani spawning server Express dan auto-open browser lintas OS (Windows, macOS, Linux).
- **Backend Service (`server/index.js`)**: Server Express ringan untuk menyajikan file statis dan menyediakan REST endpoint untuk load testing dan config management.
- **Async Test Engine (`server/testEngine.js`)**: In-memory load testing engine berbasis fetch non-blocking dengan model batch concurrency dan pooling abort controller.
- **Configuration Manager (`server/configManager.js`)**: Modul I/O disk asinkron untuk membaca dan menulis `flowcheck.config.json` di `process.cwd()`.
- **Frontend SPA (`public/index.html`)**: React 18, React Flow (dist CDN), Babel standalone, dan Tailwind CSS tanpa compiler/bundler lokal (Vite/Webpack tidak diperlukan).

---

## 2. API Specifications

### 2.1 Test Management Endpoints

#### `POST /api/test/start`
- **Tujuan**: Memulai sesi load testing baru secara asinkron.
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "url": "http://localhost:8000/api/users",
    "method": "GET",
    "totalRequests": 500,
    "concurrency": 10
  }
  ```
- **Response** (HTTP 200):
  ```json
  {
    "testId": "test_1711200000000_abc123"
  }
  ```

#### `GET /api/test/status/:testId`
- **Tujuan**: Mengambil status dan agregat metrik terkini dari load test.
- **Response** (HTTP 200):
  ```json
  {
    "sent": 340,
    "success": 332,
    "failed": 8,
    "avgResponseTime": 42.6,
    "rps": 85.2,
    "status": "running"
  }
  ```
  *(Status enum: `"running"` | `"done"` | `"stopped"`)*

#### `POST /api/test/stop`
- **Tujuan**: Menghentikan load test yang sedang berjalan secara seketika melalui AbortController signal.
- **Request Body**:
  ```json
  {
    "testId": "test_1711200000000_abc123"
  }
  ```
- **Response** (HTTP 200):
  ```json
  {
    "status": "stopped"
  }
  ```

### 2.2 Configuration Endpoints

#### `POST /api/config/save`
- **Tujuan**: Menyimpan snapshot canvas graph dan base URL ke `flowcheck.config.json` di direktori kerja user.
- **Request Body**:
  ```json
  {
    "nodes": [...],
    "edges": [...],
    "baseUrl": "http://localhost:8000"
  }
  ```
- **Response** (HTTP 200):
  ```json
  {
    "status": "saved"
  }
  ```

#### `GET /api/config/load`
- **Tujuan**: Membaca file konfigurasi `flowcheck.config.json` jika ada, atau mengembalikan graph default jika belum ada file.
- **Response** (HTTP 200):
  ```json
  {
    "nodes": [...],
    "edges": [...],
    "baseUrl": "http://localhost:8000",
    "exists": true
  }
  ```

---

## 3. Load Testing Engine Architecture (`server/testEngine.js`)

1. **Non-blocking Event Loop Mechanism**:
   - Menghindari synchronous looping atau penumpukan promise tak terkendali di microtask queue.
   - Menggunakan model concurrent worker pool: Membuka $N$ asynchronous worker loops (di mana $N = \text{concurrency}$) yang secara independen menarik request index dari counter global hingga mencapai `totalRequests`.
   - Menjaga latency time overhead server di bawah 2ms per request.
2. **Request Lifecycle & Abort Handling**:
   - Menggunakan `fetch` bawaan Node.js 18+ dengan `AbortController`.
   - Timeout terisolasi 10.000 ms per request via `AbortSignal.timeout(10000)`.
   - Global cancellation: Memanggil `controller.abort()` untuk semua active in-flight requests saat endpoint `/api/test/stop` dipanggil.
3. **Metric Calculation**:
   - Status 2xx dikategorikan sebagai **Success**.
   - Status non-2xx (4xx, 5xx), connection refused, timeout, atau error network dikategorikan sebagai **Failed**.
   - `avgResponseTime`: Running average dari total response time request yang telah selesai.
   - `rps` (Requests per second): Dihitung secara rolling window berdasarkan selisih waktu (`elapsedSeconds`).

---

## 4. Non-Functional Requirements

### 4.1 Performa & Stabilitas
- Mampu mengeksekusi 1.000 request dengan concurrency 50 tanpa freeze pada Node.js event loop dan tanpa kebocoran memori (memory leak).
- Polling interval frontend ditetapkan pada 300ms untuk menyeimbangkan real-time responsiveness dan overhead network local loopback.

### 4.2 Portabilitas Lintas Platform
- Kompatibel dengan Windows (cmd/PowerShell), macOS (zsh/bash), dan Linux.
- Pembukaan browser otomatis menggunakan helper cross-platform (`start` di Windows, `open` di macOS, `xdg-open` di Linux, atau library `open`).

### 4.3 Zero Dependency Build Tooling
- Frontend tidak boleh memerlukan `npm run build`, Webpack, Vite, atau Tailwind CLI.
- Seluruh asset styling dan React UI dijalankan via CDN (Unpkg/CDNJS/Tailwind CDN).
