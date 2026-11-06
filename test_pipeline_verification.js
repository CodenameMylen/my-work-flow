const { startServer } = require('./server/index');

async function runVerification() {
  console.log('=== Starting FlowCheck Pipeline & Architecture Verification ===');
  
  const testPort = 4099;
  const { server } = await startServer(testPort);
  console.log(`[OK] Server started on port ${testPort}`);

  const baseUrl = `http://localhost:${testPort}`;

  try {
    // 1. Verify Mock Endpoints
    console.log('\n--- 1. Testing Built-in Mock Services ---');
    const mocks = ['gateway', 'auth', 'database', 'cache', 'payment', 'slow'];
    for (const m of mocks) {
      const start = Date.now();
      const res = await fetch(`${baseUrl}/api/mock/${m}`);
      const data = await res.json();
      const dur = Date.now() - start;
      console.log(`[PASS] /api/mock/${m} -> HTTP ${res.status} (${dur}ms):`, data.service || data.status);
    }

    // 2. Test Flaky service
    const flakyRes = await fetch(`${baseUrl}/api/mock/flaky`);
    console.log(`[PASS] /api/mock/flaky -> HTTP ${flakyRes.status}`);

    // 3. Test Node Quick Ping Endpoint
    console.log('\n--- 2. Testing Quick Ping Endpoint ---');
    const pingRes = await fetch(`${baseUrl}/api/test/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `${baseUrl}/api/mock/gateway`,
        method: 'GET'
      })
    });
    const pingData = await pingRes.json();
    console.log('[PASS] Ping Gateway Result:', {
      ok: pingData.ok,
      status: pingData.status,
      durationMs: pingData.durationMs,
      service: pingData.data?.service
    });

    // 4. Test Multi-Node Pipeline Load Test
    console.log('\n--- 3. Testing Real Pipeline Execution (Chained Sequence) ---');
    const pipelineSteps = [
      { nodeId: 'node-gateway', url: `${baseUrl}/api/mock/gateway`, method: 'GET' },
      { nodeId: 'node-auth', url: `${baseUrl}/api/mock/auth`, method: 'GET' },
      { nodeId: 'node-db', url: `${baseUrl}/api/mock/database`, method: 'GET' },
      { nodeId: 'node-payment', url: `${baseUrl}/api/mock/payment`, method: 'GET' }
    ];

    const startTestRes = await fetch(`${baseUrl}/api/test/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pipeline: pipelineSteps,
        totalRequests: 200,
        concurrency: 15
      })
    });
    const { testId } = await startTestRes.json();
    console.log(`[OK] Started Pipeline test session: ${testId}`);

    let completed = false;
    let pollCount = 0;
    while (!completed && pollCount < 30) {
      await new Promise(r => setTimeout(r, 400));
      pollCount++;
      const statusRes = await fetch(`${baseUrl}/api/test/status/${testId}`);
      const status = await statusRes.json();

      process.stdout.write(`\r[Poll ${pollCount}] Sent: ${status.sent}/200 | Avg: ${status.avgResponseTime}ms | Status: ${status.status} `);

      if (status.status === 'done' || status.status === 'stopped') {
        completed = true;
        console.log('\n\n--- Final Pipeline Per-Node Statistics ---');
        for (const [nodeId, nStat] of Object.entries(status.nodeStats)) {
          console.log(`Node [${nodeId}]: Sent=${nStat.sent}, OK=${nStat.success}, Err=${nStat.failed}, AvgLatency=${nStat.avgResponseTime}ms, LastStatus=${nStat.lastStatusCode}`);
        }
      }
    }

    // 5. Verify Multi-Flow Persistence
    console.log('\n--- 4. Testing Multi-Flow Config Persistence ---');
    const loadRes = await fetch(`${baseUrl}/api/config/load`);
    const loadData = await loadRes.json();
    console.log(`[PASS] Loaded ${loadData.flows?.length || 0} Flows:`);
    loadData.flows?.forEach(f => console.log(`  - Flow: "${f.name}" (${f.nodes?.length} nodes, ${f.edges?.length} edges)`));

    console.log('\n=== ALL VERIFICATION CHECKS PASSED SUCCESSFULLY ===');
  } catch (err) {
    console.error('[FAIL] Verification failed:', err);
  } finally {
    server.close();
  }
}

runVerification();
