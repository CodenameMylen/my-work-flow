# System Architecture - FlowCheck

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Host Machine
        CLI["CLI Launcher (bin/flowcheck.js)"]
        Browser["User Web Browser (http://localhost:4000)"]
    end

    subgraph FlowCheck Local Server (Node.js / Express)
        HTTP["Express Server (server/index.js)"]
        Static["Public Static Server (public/index.html)"]
        API["REST API Router"]
        Engine["Load Test Engine (server/testEngine.js)"]
        Config["Config Manager (server/configManager.js)"]
        Storage["Disk Storage (flowcheck.config.json)"]
    end

    subgraph Target Infrastructure
        TargetAPI["Target HTTP Service / API Endpoint"]
    end

    CLI -->|Spawns Server & Opens URL| HTTP
    Browser -->|GET /| Static
    Browser -->|Polling /api/test/status/| API
    Browser -->|POST /api/test/start & /stop| API
    Browser -->|GET/POST /api/config/| API
    API --> Engine
    API --> Config
    Config <--> Storage
    Engine -->|Concurrent Async Batches / Fetch| TargetAPI
```

---

## 2. Component Breakdown

### 2.1 CLI Entry Point (`bin/flowcheck.js`)
- Diatur di `package.json` dalam field `"bin": { "flowcheck": "./bin/flowcheck.js" }`.
- Bertanggung jawab untuk:
  1. Memeriksa keberadaan port 4000.
  2. Menginisialisasi `server/index.js`.
  3. Membuka browser default ke URL server lokal.
  4. Menangani graceful shutdown (`SIGINT`, `SIGTERM`).

### 2.2 Server Core (`server/index.js`)
- Express app sederhana dengan middleware `express.json()` dan `express.static('public')`.
- Mounting router API untuk test runner dan config storage.
- Menangani CORS untuk fleksibilitas testing jika diperlukan.

### 2.3 Non-blocking Test Engine (`server/testEngine.js`)
- Menyimpan registry active test dalam memory dictionary `tests = Map<testId, TestSession>()`.
- Setiap sesi mengelola:
  - `stats`: `{ sent, success, failed, totalResponseTime, startTime, status, rps, avgResponseTime }`
  - `abortController`: Instans `AbortController` yang terhubung ke semua request fetch.
- Worker Pool Implementation:
  ```js
  async function runWorker(testId, session) {
    while (session.status === 'running' && session.currentIndex < session.totalRequests) {
      const reqIndex = session.currentIndex++;
      await executeSingleRequest(testId, session, reqIndex);
    }
  }
  ```
  Dengan $K$ worker bersamaan (di mana $K = \text{concurrency}$), event loop tetap responsif untuk menangani request polling GET dari browser.

### 2.4 Persistence Manager (`server/configManager.js`)
- Membaca `path.join(process.cwd(), 'flowcheck.config.json')`.
- Jika belum ada, menyajikan seed default (contoh node Client → API → Server → Database) agar canvas langsung terisi saat pertama kali dibuka.
- Menyimpan struktur node koordinat, tipe, custom label, dan sambungan edges.

### 2.5 Single-Page Frontend Architecture (`public/index.html`)
- Menggunakan CDN scripts:
  - React 18 & ReactDOM 18 (`react.production.min.js`, `react-dom.production.min.js`)
  - Babel Standalone (`babel.min.js`) untuk JSX transpilation in-browser.
  - React Flow (Umd bundle & React Flow CSS).
  - Tailwind CSS script CDN.
  - Heroicons / Lucide icons (SVG).
- Komponen Modular In-File:
  - `<App />`: Root state (nodes, edges, activeTest, metrics, controlState).
  - `<StatsBar />`: Real-time pill metric bar di bagian atas.
  - `<FlowCanvas />`: Wrapper ReactFlow dengan custom node component (`<CustomServiceNode />`).
  - `<ControlPanel />`: Form konfigurasi, node adder, edge adder, test parameters, dan summary scorecard.
  - `<EdgeDotsAnimation />`: SVG overlay / React Flow animated stroke & keyframe animation yang diaktifkan saat testing.
