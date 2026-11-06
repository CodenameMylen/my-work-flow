const crypto = require('crypto');

// In-memory test sessions store
const sessions = new Map();

function generateTestId() {
  return `test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Start a new load test session (Single URL or Pipeline Chained Steps)
 */
function startTest({ url, method = 'GET', totalRequests = 100, concurrency = 10, pipeline = null }) {
  const testId = generateTestId();
  const safeTotal = Math.max(1, parseInt(totalRequests, 10) || 100);
  const safeConcurrency = Math.min(safeTotal, Math.max(1, parseInt(concurrency, 10) || 10));

  const abortController = new AbortController();

  // Validate pipeline if provided
  const hasPipeline = Array.isArray(pipeline) && pipeline.length > 0;

  const nodeStats = {};
  if (hasPipeline) {
    pipeline.forEach(step => {
      nodeStats[step.nodeId] = {
        nodeId: step.nodeId,
        url: step.url,
        sent: 0,
        success: 0,
        failed: 0,
        totalResponseTime: 0,
        avgResponseTime: 0,
        lastStatusCode: null,
        lastError: null
      };
    });
  }

  const session = {
    testId,
    url: url || (hasPipeline ? pipeline[0].url : ''),
    method: (method || 'GET').toUpperCase(),
    totalRequests: safeTotal,
    concurrency: safeConcurrency,
    pipeline: hasPipeline ? pipeline : null,
    nodeStats,
    abortController,
    status: 'running', // 'running' | 'done' | 'stopped'
    startTime: Date.now(),
    endTime: null,
    dispatchedCount: 0,
    success: 0,
    failed: 0,
    totalResponseTime: 0,
    workers: []
  };

  sessions.set(testId, session);

  // Launch async worker pool in background
  runTestSession(session).catch(err => {
    console.error(`[TestEngine] Error in session ${testId}:`, err);
    session.status = 'stopped';
    session.endTime = Date.now();
  });

  return { testId };
}

/**
 * Worker pool runner (non-blocking)
 */
async function runTestSession(session) {
  const { concurrency } = session;
  const workerPromises = [];

  for (let i = 0; i < concurrency; i++) {
    workerPromises.push(workerLoop(session));
  }

  await Promise.all(workerPromises);

  if (session.status === 'running') {
    session.status = 'done';
  }
  session.endTime = Date.now();
}

/**
 * Individual worker taking requests until quota is reached or stopped
 */
async function workerLoop(session) {
  while (session.status === 'running') {
    if (session.dispatchedCount >= session.totalRequests) {
      break;
    }

    session.dispatchedCount++;

    if (session.pipeline && session.pipeline.length > 0) {
      await executePipelineRequest(session);
    } else {
      await executeSingleRequest(session);
    }

    // Minor yield to ensure microtask queue does not starve
    await new Promise(resolve => setImmediate(resolve));
  }
}

/**
 * Executes a full pipeline chain: Step 1 -> Step 2 -> Step 3
 * If a step fails, subsequent steps in the chain are aborted for this user request.
 */
async function executePipelineRequest(session) {
  if (session.status !== 'running') return;

  let pipelineOverallDuration = 0;
  let pipelineSuccess = true;

  for (const step of session.pipeline) {
    if (session.status !== 'running') break;

    const stats = session.nodeStats[step.nodeId];
    if (stats) stats.sent++;

    const reqStart = performance.now();
    let stepSuccess = false;

    const timeoutId = setTimeout(() => {
      session.abortController.abort();
    }, 10000);

    try {
      const res = await fetch(step.url, {
        method: (step.method || 'GET').toUpperCase(),
        headers: {
          'User-Agent': 'FlowCheck-Pipeline/1.0',
          'Accept': 'application/json, text/plain, */*',
          ...(step.headers || {})
        },
        body: step.body ? (typeof step.body === 'string' ? step.body : JSON.stringify(step.body)) : undefined,
        signal: session.abortController.signal
      });

      clearTimeout(timeoutId);
      const duration = performance.now() - reqStart;
      pipelineOverallDuration += duration;

      if (stats) {
        stats.totalResponseTime += duration;
        stats.lastStatusCode = res.status;
      }

      if (res.status >= 200 && res.status < 400) {
        stepSuccess = true;
        if (stats) stats.success++;
      } else {
        if (stats) {
          stats.failed++;
          stats.lastError = `HTTP ${res.status}`;
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const duration = performance.now() - reqStart;
      pipelineOverallDuration += duration;
      if (stats) {
        stats.totalResponseTime += duration;
        stats.failed++;
        stats.lastError = err.message;
      }
    }

    if (stats && stats.sent > 0) {
      stats.avgResponseTime = Math.round(stats.totalResponseTime / stats.sent);
    }

    // If step failed, chain breaks for this request
    if (!stepSuccess) {
      pipelineSuccess = false;
      break;
    }
  }

  session.totalResponseTime += pipelineOverallDuration;
  if (pipelineSuccess) {
    session.success++;
  } else {
    session.failed++;
  }
}

/**
 * Single request execution with timeout and error tracking
 */
async function executeSingleRequest(session) {
  if (session.status !== 'running') return;

  const reqStart = performance.now();
  const timeoutId = setTimeout(() => {
    session.abortController.abort();
  }, 10000);

  try {
    const res = await fetch(session.url, {
      method: session.method,
      headers: {
        'User-Agent': 'FlowCheck/1.0',
        'Accept': '*/*'
      },
      signal: session.abortController.signal
    });

    clearTimeout(timeoutId);
    const duration = performance.now() - reqStart;
    session.totalResponseTime += duration;

    if (res.status >= 200 && res.status < 400) {
      session.success++;
    } else {
      session.failed++;
    }
  } catch (err) {
    clearTimeout(timeoutId);
    const duration = performance.now() - reqStart;
    session.totalResponseTime += duration;
    session.failed++;
  }
}

/**
 * Get current stats of a test
 */
function getTestStatus(testId) {
  const session = sessions.get(testId);
  if (!session) {
    return null;
  }

  const completed = session.success + session.failed;
  const now = session.endTime || Date.now();
  const elapsedSec = Math.max(0.1, (now - session.startTime) / 1000);

  const avgResponseTime = completed > 0
    ? Math.round(session.totalResponseTime / completed)
    : 0;

  const rps = completed > 0
    ? Math.round((completed / elapsedSec) * 10) / 10
    : 0;

  return {
    testId: session.testId,
    sent: completed,
    totalRequests: session.totalRequests,
    success: session.success,
    failed: session.failed,
    avgResponseTime,
    rps,
    status: session.status,
    nodeStats: session.nodeStats || {}
  };
}

/**
 * Stop an ongoing test
 */
function stopTest(testId) {
  const session = sessions.get(testId);
  if (!session) {
    return { status: 'not_found' };
  }

  if (session.status === 'running') {
    session.status = 'stopped';
    session.endTime = Date.now();
    try {
      session.abortController.abort();
    } catch (e) {
      // ignore
    }
  }

  return { status: 'stopped' };
}

/**
 * Quick single-request ping with full response inspection
 */
async function pingEndpoint({ url, method = 'GET', headers = {}, body = null }) {
  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: (method || 'GET').toUpperCase(),
      headers: {
        'User-Agent': 'FlowCheck-Ping/1.0',
        'Accept': 'application/json, text/plain, */*',
        ...headers
      },
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const duration = Math.round(performance.now() - start);

    let responseData = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      responseData = await res.json();
    } else {
      const text = await res.text();
      responseData = text.slice(0, 1000); // truncate if very large
    }

    const responseHeaders = {};
    res.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      durationMs: duration,
      headers: responseHeaders,
      data: responseData
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const duration = Math.round(performance.now() - start);
    return {
      ok: false,
      status: 0,
      statusText: err.name === 'AbortError' ? 'Timeout (8s)' : err.message,
      durationMs: duration,
      headers: {},
      data: null,
      error: err.message
    };
  }
}

module.exports = {
  startTest,
  getTestStatus,
  stopTest,
  pingEndpoint
};
