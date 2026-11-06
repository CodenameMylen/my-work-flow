# Design System & UI Specifications - FlowCheck

## 1. Visual Identity & Theme
FlowCheck mengusung identitas **Modern Developer Tooling UI** yang bersih, fungsional, dan bertema *Precision Dark Interface*:
- **Background Utama**: Slate 950 (`#020617` / `#090d16`) dengan subtle grid / dot pattern di canvas.
- **Card & Node Surfaces**: Slate 900 (`#0f172a`) dengan border Slate 800 (`#1e293b`).
- **Accent & Status Colors**:
  - `Idle`: Border `#475569` (Slate 600), Text `#94a3b8` (Slate 400), Pill `#1e293b`.
  - `Healthy`: Border `#10b981` (Emerald 500), Glow `rgba(16, 185, 129, 0.2)`, Text `#34d399`.
  - `Warning`: Border `#f59e0b` (Amber 500), Glow `rgba(245, 158, 11, 0.2)`, Text `#fbbf24`.
  - `Overloaded`: Border `#ef4444` (Rose 500), Glow `rgba(239, 68, 68, 0.25)`, Text `#f87171`.
- **Typography**:
  - UI Font: Inter / System sans-serif (`font-sans`).
  - Metrics & Numbers: JetBrains Mono / Fira Code / monospace (`font-mono`) untuk hit counter, latency, RPS, dan persentase.

---

## 2. Layout Hierarchy

```
+------------------------------------------------------------------------------+
| [⚡ FlowCheck]  [ 1.400 sent · avg 120ms · 98% success · 89 req/s ]  [● LIVE] |  <- Stats Bar
+-------------------------------------------------------+----------------------+
|                                                       | Base URL Config      |
|                                                       +----------------------+
|                     FLOW CANVAS                       | Graph Controls:      |
|                        (70%)                          | [+ Node] [+ Edge]    |
|                                                       | [Trash Selected]     |
|   [Client] ---> [API] ---> [Server] ---> [Database]   +----------------------+
|     (●)          (●)         (●)             (●)      | Load Test Settings:  |
|                                                       | Target: Node API     |
|                                                       | Requests: [100][500] |
|                                                       | Concurrency: [1][10] |
|                                                       | [▶ Run Test] [■ Stop]|
|                                                       +----------------------+
|                                                       | Scorecard Results    |
|                                                       +----------------------+
|                                                       | [💾 Save] [📂 Load]  |
+-------------------------------------------------------+----------------------+
```

---

## 3. Node Component Anatomy (`<CustomServiceNode />`)
Setiap node memiliki struktur visual yang jelas dan kaya informasi:
1. **Header Bar**:
   - Icon sesuai tipe (Laptop untuk Client, Globe/Layers untuk API, Server untuk Server, Database untuk DB, Cpu/Boxes untuk Service).
   - Label Nama Node (editable atau custom text).
   - Type Badge mini di sudut kanan atas.
2. **Body**:
   - Status Badge (Pill berwarna: `Idle`, `Healthy`, `Warning`, `Overloaded`).
   - Endpoint URL snippet (jika ada, e.g. `GET /api/v1/checkout`).
3. **Footer Metrics**:
   - Live Hit Counter dengan font monospace berukuran besar (misal: `1,240 hits`).
   - Status percentage bar kecil atau response time indicator.
4. **Connection Handles**:
   - Target handle di sebelah kiri (Input).
   - Source handle di sebelah kanan (Output).

---

## 4. Edge Dot Flow Animation
Untuk menganimasikan aliran request di React Flow:
- **Teknik CSS Stroke Dasharray / SVG Particle**:
  - Menggunakan React Flow edge `animated: isTestRunning`.
  - Kustomisasi CSS:
    ```css
    .react-flow__edge.running path {
      stroke: #38bdf8 !important;
      stroke-width: 2.5px;
      stroke-dasharray: 6 6;
      animation: flowAnimation 0.8s linear infinite;
    }
    @keyframes flowAnimation {
      from { stroke-dashoffset: 24; }
      to { stroke-dashoffset: 0; }
    }
    ```
  - Untuk efek partikel dot yang lebih hidup, disematkan glowing drop-shadow (`filter: drop-shadow(0 0 4px #0284c7)`).
  - Ketika test berhenti, kelas `running` dicabut dan edge kembali statis (`#334155`).

---

## 5. Control Panel & Micro-interactions
- **Presets Button Group**: Tombol total request (`100`, `500`, `1000`) dan concurrency (`1`, `10`, `50`) menggunakan toggle state interaktif dengan border glow saat aktif.
- **Run Button State**:
  - Idle: Tombol Emerald solid dengan ikon Play (`Run Test`).
  - Running: Tombol beranimasi pulse dengan spinner loading.
  - Stop Button: Tombol Rose/Red outline yang aktif hanya saat test berjalan.
- **Scorecard Metric Tiles**: Grid 2x2 atau 3x2 menampilkan Total, Success, Failed, Avg Latency, dan RPS dalam font mono kontras tinggi.
