# Project Tasks Breakdown - FlowCheck

## Phase 1: Environment & Project Scaffolding
- [x] **Task 1.1**: Initialize `package.json` with dependencies (`express`, `open` or cross-platform launcher, etc.) and CLI bin setup.
- [x] **Task 1.2**: Create directory structure (`bin/`, `server/`, `public/`).
- [x] **Task 1.3**: Configure `flowcheck.config.json` default seed data loader.

## Phase 2: Backend Development & Load Test Engine
- [x] **Task 2.1**: Implement `server/configManager.js` for disk persistence (save & load operations in current working directory).
- [x] **Task 2.2**: Implement `server/testEngine.js` with non-blocking async batching, AbortController support, and live metric aggregation.
- [x] **Task 2.3**: Build Express server routes in `server/index.js` (`POST /api/test/start`, `GET /api/test/status/:testId`, `POST /api/test/stop`, `POST /api/config/save`, `GET /api/config/load`).

## Phase 3: Frontend Single-File Architecture (`public/index.html`)
- [x] **Task 3.1**: Setup single-file HTML with CDN imports for React 18, React Flow, Tailwind CSS, and Babel.
- [x] **Task 3.2**: Implement `<CustomServiceNode />` with dynamic health status borders, badges, and real-time hit counters.
- [x] **Task 3.3**: Implement React Flow canvas with custom edge animations (glowing moving dots during active tests).
- [x] **Task 3.4**: Implement Control Panel with Base URL, Add Node modal, Add Edge selector, Delete selected, and Load Test presets (requests & concurrency).
- [x] **Task 3.5**: Implement Top Real-Time Stats Bar with 300ms polling loop, and Result Summary scorecard.

## Phase 4: CLI Entry Point & Cross-Platform Launcher
- [x] **Task 4.1**: Build `bin/flowcheck.js` with port binding, terminal banner, and cross-platform browser auto-open.
- [x] **Task 4.2**: Configure `npm link` test and verify CLI command `flowcheck`.

## Phase 5: Verification & Stress Testing
- [x] **Task 5.1**: Test non-blocking behavior with 1,000 requests and concurrency 50 against local mock endpoints.
- [x] **Task 5.2**: Verify flow diagram save and reload persistence across CLI restarts.
- [x] **Task 5.3**: Verify graceful stop handling and error states (timeout, connection refused, 4xx/5xx).
