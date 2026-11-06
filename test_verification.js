const { startServer } = require('./server/index');
const { saveConfig, loadConfig } = require('./server/configManager');
const assert = require('assert');

async function runVerification() {
  console.log('🧪 Starting FlowCheck Automated Verification Suite...\n');

  // 1. Test Config Manager
  console.log('1️⃣ Testing Config Manager (Save & Load)...');
  const dummyNodes = [{ id: 'test-1', data: { name: 'TestNode', hits: 10 } }];
  const dummyEdges = [{ id: 'edge-1', source: 'test-1', target: 'test-2' }];
  saveConfig({ nodes: dummyNodes, edges: dummyEdges, baseUrl: 'http://localhost:9999' });

  const loaded = loadConfig();
  assert.strictEqual(loaded.exists, true, 'Config should exist after save');
  assert.strictEqual(loaded.nodes.length, 1, 'Nodes length should match saved');
  assert.strictEqual(loaded.nodes[0].id, 'test-1', 'Node id should match');
  console.log('   ✅ ConfigManager Save & Load passed.\n');

  // 2. Test Server Startup
  console.log('2️⃣ Testing Express Server & API endpoints...');
  const { server, port } = await startServer(4005);
  const baseUrl = `http://localhost:${port}`;

  try {
    // 2.1 Test Static index.html serve
    const resHtml = await fetch(`${baseUrl}/`);
    assert.strictEqual(resHtml.status, 200, 'HTML file should return 200');
    const htmlText = await resHtml.text();
    assert.ok(htmlText.includes('FlowCheck'), 'HTML should contain FlowCheck title');
    console.log('   ✅ Static index.html served successfully.');

    // 2.2 Test Mock Endpoint
    const resMock = await fetch(`${baseUrl}/api/mock/ping`);
    assert.strictEqual(resMock.status, 200, 'Mock ping should return 200');
    const mockData = await resMock.json();
    assert.strictEqual(mockData.status, 'ok', 'Mock ping status should be ok');
    console.log('   ✅ Mock Ping endpoint responsive.');

    // 3. Test Load Engine - 1,000 requests, concurrency 50
    console.log('\n3️⃣ Testing Load Test Engine (1,000 requests @ concurrency 50)...');
    const startRes = await fetch(`${baseUrl}/api/test/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `${baseUrl}/api/mock/ping`,
        method: 'GET',
        totalRequests: 1000,
        concurrency: 50
      })
    });
    assert.strictEqual(startRes.status, 200, 'Start test should return 200');
    const { testId } = await startRes.json();
    assert.ok(testId, 'TestId should be returned');
    console.log(`   Initiated test session: ${testId}`);

    // Poll until done
    let finalStatus = null;
    let pollCount = 0;
    while (pollCount < 40) {
      await new Promise(r => setTimeout(r, 200));
      const statusRes = await fetch(`${baseUrl}/api/test/status/${testId}`);
      finalStatus = await statusRes.json();
      process.stdout.write(`\r   Progress: ${finalStatus.sent}/${finalStatus.totalRequests} sent (${finalStatus.rps} req/s, status: ${finalStatus.status})`);
      if (finalStatus.status === 'done' || finalStatus.status === 'stopped') {
        break;
      }
      pollCount++;
    }
    console.log('\n');
    assert.strictEqual(finalStatus.status, 'done', 'Test should reach done status');
    assert.strictEqual(finalStatus.sent, 1000, 'Sent requests should be 1000');
    assert.strictEqual(finalStatus.success, 1000, 'All 1000 should be success for mock ping');
    console.log(`   ✅ 1,000 requests completed successfully at ${finalStatus.rps} req/s with avg ${finalStatus.avgResponseTime}ms latency!`);

    // 4. Test Stop Signal
    console.log('\n4️⃣ Testing Stop Signal on Long Test...');
    const longStartRes = await fetch(`${baseUrl}/api/test/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `${baseUrl}/api/mock/slow`,
        method: 'GET',
        totalRequests: 500,
        concurrency: 5
      })
    });
    const { testId: longTestId } = await longStartRes.json();
    await new Promise(r => setTimeout(r, 250)); // let a few run

    const stopRes = await fetch(`${baseUrl}/api/test/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId: longTestId })
    });
    const stopJson = await stopRes.json();
    assert.strictEqual(stopJson.status, 'stopped', 'Stop endpoint should confirm stopped');

    const statusAfterStop = await (await fetch(`${baseUrl}/api/test/status/${longTestId}`)).json();
    assert.strictEqual(statusAfterStop.status, 'stopped', 'Session status should be stopped');
    console.log(`   ✅ Test aborted cleanly on request ${statusAfterStop.sent}/500.`);

    console.log('\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀\n');

  } finally {
    server.close();
  }
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
