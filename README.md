# ⚡ FlowCheck

> Real-time flow visualization and load testing tool for developers.

FlowCheck allows you to visually map your system topology (Client → API → Server → Database → Microservice) and launch concurrent HTTP load tests against any endpoint while viewing animated live request flow and instant node health metrics.

---

## 🌟 Highlights

- **⚡ Zero Setup / Zero Build Step**: Frontend is a pure single-file SPA using React 18, React Flow, and Tailwind CSS loaded via CDN. No Vite/Webpack build steps required.
- **🖥️ Instant CLI Experience**: Run `flowcheck` anywhere in your terminal; the browser auto-launches to `http://localhost:4000`.
- **🌊 Animated Request Flow**: Moving dots flow along canvas edges during active load tests, stopping immediately when the test completes or is halted.
- **🚥 Dynamic Node Health**: Node borders and badges dynamically shift based on real-time success rates:
  - 🟢 **Healthy** (>90% success)
  - 🟡 **Warning** (50% – 90% success)
  - 🔴 **Overloaded** (<50% success)
  - ⚪ **Idle** (untested)
- **🚀 High-Concurrency Engine**: Asynchronous worker pool using Node.js native `fetch` with `AbortController` timeout handling. Handles 1,000+ requests at concurrency 50 without blocking the Express event loop.
- **💾 Local Persistence**: Saves your architecture graph and presets directly to `flowcheck.config.json` in your current working directory.

---

## 📦 Installation & Quick Start

### 1. Global CLI Linking
To make the `flowcheck` command accessible anywhere on your machine:

```bash
# From the repository root
npm link
```

### 2. Launch FlowCheck
Open any terminal / command prompt and run:

```bash
flowcheck
```

FlowCheck will start on port `4000` (or the port specified by `PORT=XXXX`) and automatically open `http://localhost:4000` in your default web browser.

---

## 🛠️ Usage Guide

1. **Build Your Topology**:
   - Click **[Add Node]** to create `Client`, `API`, `Server`, `Database`, or `Service` components.
   - Enter an **Endpoint URL** (e.g., `http://localhost:4000/api/mock/ping` or your local server `http://localhost:8000/api/v1/health`) for nodes you wish to benchmark.
   - Click **[Add Edge]** or drag handles between nodes to connect request flows.
2. **Configure Load Test**:
   - Select your target node from the dropdown.
   - Pick total requests (`100`, `500`, `1000`, or a custom number).
   - Pick concurrency (`1`, `10`, `50`).
3. **Run & Observe**:
   - Click **[Run Test]**.
   - Watch the animated dots stream through connected edges.
   - Monitor the Top Stats Bar for live throughput (`req/s`), average latency (`ms`), and success rate.
4. **Persist Your Flow**:
   - Click **[Save Flow]** to store the canvas state into `flowcheck.config.json`.
   - Next time you launch `flowcheck` in that folder, your diagram will load automatically!

---

## 🔌 Built-in Mock Endpoints
For testing FlowCheck immediately without running an external server:
- `http://localhost:4000/api/mock/ping` — Fast 200 OK responses
- `http://localhost:4000/api/mock/slow` — Simulated ~80ms delayed responses
- `http://localhost:4000/api/mock/flaky` — Simulated ~25% failure rate to test Warning / Overloaded status transitions

---

## 📂 Project Structure

```
flowcheck/
├── bin/
│   └── flowcheck.js        # CLI launcher, banner, and cross-platform browser opener
├── server/
│   ├── index.js            # Express server & API routes
│   ├── testEngine.js       # Non-blocking async load test worker pool
│   └── configManager.js    # Persistence for flowcheck.config.json
├── public/
│   └── index.html          # Entire React SPA UI in one file
├── package.json
└── README.md
```

---

## 📄 License
MIT
