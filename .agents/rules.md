# Engineering Rules & Guidelines - FlowCheck

## 1. Zero Build Step Mandate (Anti AI-Slop & Strict Simplicity)
- **TIDAK ADA BUILD STEP**: Dilarang menginstal atau menambahkan Vite, Webpack, Parcel, esbuild, Babel CLI, TypeScript compiler, atau build bundler lainnya untuk frontend.
- Frontend **WAJIB** berada di dalam satu file `public/index.html` murni dengan script CDN yang valid dan stabil (React 18, React Flow, Tailwind CSS, Babel Standalone).
- Kode frontend harus ditulis secara clean, modular, dan rapi dalam tag `<script type="text/babel">` di dalam `public/index.html`.

## 2. Backend & Runtime Guidelines
- **Runtime**: Node.js versi 18+ LTS (memanfaatkan `fetch` native).
- **Web Framework**: Hanya Express.js yang diizinkan untuk web server backend.
- **Database**: Dilarang menambahkan database eksternal (SQLite, MongoDB, PostgreSQL, dsb). Semua state runtime berada di memory, sedangkan persistensi diagram murni file lokal `flowcheck.config.json` di `process.cwd()`.
- **Non-blocking Event Loop**: Engine load test dilarang menggunakan loop sinkron (seperti `while(true)`) atau membuat jutaan promise tak terkendali sekaligus yang dapat menyebabkan *Out of Memory (OOM)* atau membekukan event loop Node.js. Gunakan concurrent worker loop dengan batasan concurrency.
- **Request Safety**: Setiap outgoing request ke target URL wajib dibatasi timeout maksimal 10 detik dan terikat pada `AbortSignal`.

## 3. UI/UX & Design Standards
- **No Generic AI Slop**: Hindari layout kaku, gradient ungu-biru murahan, atau shadow berlebih yang tidak proporsional. Gunakan palet dark-mode profesional ala developer tools modern (seperti Linear, Raycast, Vercel).
- **Layout Ratio**:
  - Top Bar: Real-time Stats Bar (h-14 / h-16, fixed, flex items-center justify-between).
  - Main Body: Flex row (70% Canvas di kiri, 30% Control Panel di kanan).
- **Visual Feedback**:
  - Warna status node harus jelas dan konsisten:
    - `Idle` -> Slate/Gray border & badge.
    - `Healthy` (>90% success) -> Emerald/Green border & badge.
    - `Warning` (50–90% success) -> Amber/Yellow border & badge.
    - `Overloaded` (<50% success) -> Rose/Red border & badge.
  - Aliran animasi titik (*dots*) di edge hanya boleh aktif ketika status load test bernilai `"running"`.

## 4. Cross-Platform CLI Guarantees
- Command `flowcheck` harus dapat dipanggil secara global via `npm link` atau `npx`.
- Skrip entry `bin/flowcheck.js` wajib memiliki shebang `#!/usr/bin/env node` dan permission executable.
- Pembukaan browser harus aman di Windows (PowerShell/CMD), macOS, dan Linux tanpa melempar unhandled error jika browser gagal dibuka.
