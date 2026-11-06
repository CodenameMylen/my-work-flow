# Multi-Agent Roster & Responsibility Matrix - FlowCheck

Dokumen ini mendefinisikan pembagian peran subagent jika workflow `/team` diaktifkan:

## 1. Backend Engineer Agent
- **Fokus**:
  - `server/index.js` (Express routing & static serving)
  - `server/testEngine.js` (Async non-blocking batch engine, metric calculators, cancellation handlers)
  - `server/configManager.js` (File I/O untuk `flowcheck.config.json`)
  - `bin/flowcheck.js` (CLI launcher, argument parsing, graceful shutdown)
- **Model Rekomendasi**: Inherit / Pro

## 2. Frontend Engineer Agent
- **Fokus**:
  - `public/index.html` (Single file React SPA)
  - Integrasi React Flow via CDN, dynamic node styling (Healthy/Warning/Overloaded), moving dots CSS/SVG edge animations
  - Top Stats Bar polling (300ms) & Control Panel state management
  - Modal form Add Node, Add Edge, presets selector
- **Model Rekomendasi**: Inherit / Pro

## 3. QA & Reliability Engineer Agent
- **Fokus**:
  - Testing 1000 requests concurrency 50 load capacity
  - Validasi mock endpoints (200 OK, 500 error, slow delay)
  - Verifikasi persistensi `flowcheck.config.json` di Windows, macOS, dan Linux
  - Verifikasi edge cases (invalid URL, abort test di tengah jalan, port clash)
- **Model Rekomendasi**: Inherit / Flash
