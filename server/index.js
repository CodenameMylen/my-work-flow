const express = require('express');
const path = require('path');
const { startTest, getTestStatus, stopTest, pingEndpoint } = require('./testEngine');
const { loadConfig, saveConfig } = require('./configManager');

function createServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS headers for flexibility
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Serve static UI
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));

  // --- API Routes ---

  // Start load test (supports both single target URL and pipeline steps)
  app.post('/api/test/start', (req, res) => {
    try {
      const { url, method = 'GET', totalRequests = 100, concurrency = 10, pipeline = null } = req.body;
      if (!url && (!pipeline || pipeline.length === 0)) {
        return res.status(400).json({ error: 'Target URL or Pipeline steps are required' });
      }

      const result = startTest({ url, method, totalRequests, concurrency, pipeline });
      res.json(result);
    } catch (err) {
      console.error('[API] /api/test/start error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Quick single ping / inspection test for any node
  app.post('/api/test/ping', async (req, res) => {
    try {
      const { url, method = 'GET', headers = {}, body = null } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'Target URL is required for ping' });
      }

      const result = await pingEndpoint({ url, method, headers, body });
      res.json(result);
    } catch (err) {
      console.error('[API] /api/test/ping error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get test status / metrics
  app.get('/api/test/status/:testId', (req, res) => {
    try {
      const { testId } = req.params;
      const status = getTestStatus(testId);
      if (!status) {
        return res.status(404).json({ error: 'Test session not found' });
      }
      res.json(status);
    } catch (err) {
      console.error('[API] /api/test/status error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Stop test
  app.post('/api/test/stop', (req, res) => {
    try {
      const { testId } = req.body;
      if (!testId) {
        return res.status(400).json({ error: 'testId is required' });
      }
      const result = stopTest(testId);
      res.json(result);
    } catch (err) {
      console.error('[API] /api/test/stop error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Save flow config (properly extracts multi-flow data)
  app.post('/api/config/save', (req, res) => {
    try {
      const { flows, activeFlowId, nodes, edges, baseUrl } = req.body;
      const result = saveConfig({ flows, activeFlowId, nodes, edges, baseUrl });
      res.json(result);
    } catch (err) {
      console.error('[API] /api/config/save error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Load flow config
  app.get('/api/config/load', (req, res) => {
    try {
      const config = loadConfig();
      res.json(config);
    } catch (err) {
      console.error('[API] /api/config/load error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // REALISTIC BUILT-IN MOCK ARCHITECTURE SERVICES
  // ==========================================

  // 1. API Gateway (Ultra-fast routing layer, 2-5ms)
  app.get('/api/mock/gateway', (req, res) => {
    res.json({
      service: 'API Gateway',
      status: 'UP',
      protocol: 'HTTP/2',
      latencyMs: 3,
      traceId: `trace_${Date.now()}`
    });
  });

  // 2. Auth Service (Token verification, 15ms)
  app.get('/api/mock/auth', (req, res) => {
    res.json({
      service: 'Auth Service',
      authenticated: true,
      user: { id: 'usr_8821', role: 'admin' },
      tokenExpiresIn: 3600
    });
  });

  // 3. Database Service (SQL/NoSQL query simulation, 35ms)
  app.get('/api/mock/database', (req, res) => {
    res.json({
      service: 'PostgreSQL DB',
      query: 'SELECT * FROM orders ORDER BY created_at DESC LIMIT 50',
      rowsAffected: 42,
      executionMs: 35,
      poolActive: 12
    });
  });

  // 4. Redis Cache (In-memory lookup, 2ms)
  app.get('/api/mock/cache', (req, res) => {
    res.json({
      service: 'Redis Cache Cluster',
      hit: true,
      key: 'session:usr_8821',
      ttlRemaining: 1740,
      memoryUsed: '24.8MB'
    });
  });

  // 5. Payment Gateway (External processor, 110ms)
  app.get('/api/mock/payment', (req, res) => {
    res.json({
      service: 'Stripe/Payment Gateway',
      transactionId: `tx_${Date.now()}`,
      status: 'CAPTURED',
      amount: 49.99,
      currency: 'USD'
    });
  });

  // 6. Slow Legacy Backend (Simulates high-latency bottleneck, 280ms)
  app.get('/api/mock/slow', (req, res) => {
    setTimeout(() => {
      res.json({
        service: 'Legacy Warehouse ERP',
        status: 'warning_delayed',
        delayMs: 280,
        warning: 'High processing queue bottleneck'
      });
    }, 280);
  });

  // 7. Flaky External Service (30% failure rate with 500 error)
  app.get('/api/mock/flaky', (req, res) => {
    const isError = Math.random() < 0.3;
    if (isError) {
      return res.status(500).json({
        service: 'External Courier API',
        error: '500 Internal Gateway Timeout',
        detail: 'Upstream vendor dropped connection'
      });
    }
    res.json({
      service: 'External Courier API',
      status: 'UP',
      deliveryEstimate: '2 business days'
    });
  });

  // 8. Legacy Ping (for backward compatibility)
  app.get('/api/mock/ping', (req, res) => {
    res.json({ status: 'ok', service: 'FlowCheck Mock Gateway', time: Date.now() });
  });

  // Catch-all to public/index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  return app;
}

function startServer(port = 4000) {
  const app = createServer();
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      resolve({ server, port });
    });
    server.on('error', (err) => {
      reject(err);
    });
  });
}

if (require.main === module) {
  const port = process.env.PORT || 4000;
  startServer(port).then(() => {
    console.log(`[FlowCheck] Server running on http://localhost:${port}`);
  }).catch(err => {
    console.error(`[FlowCheck] Failed to start server:`, err);
    process.exit(1);
  });
}

module.exports = {
  createServer,
  startServer
};
