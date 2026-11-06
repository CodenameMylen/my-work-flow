const fs = require('fs');
const path = require('path');

const CONFIG_FILENAME = 'flowcheck.config.json';

function getConfigPath() {
  return path.join(process.cwd(), CONFIG_FILENAME);
}

// 1. E-Commerce Checkout Pipeline
const ECOMMERCE_NODES = [
  {
    id: 'node-client',
    type: 'customService',
    position: { x: 40, y: 180 },
    data: { name: 'Web Store Client', serviceType: 'Client', endpoint: '', hits: 0, status: 'idle', statusLabel: 'IDLE' }
  },
  {
    id: 'node-gateway',
    type: 'customService',
    position: { x: 260, y: 180 },
    data: { name: 'API Gateway', serviceType: 'API', endpoint: 'http://localhost:4000/api/mock/gateway', hits: 0, status: 'idle', statusLabel: 'IDLE' }
  },
  {
    id: 'node-auth',
    type: 'customService',
    position: { x: 500, y: 90 },
    data: { name: 'Auth Guard', serviceType: 'Service', endpoint: 'http://localhost:4000/api/mock/auth', hits: 0, status: 'idle', statusLabel: 'IDLE' }
  },
  {
    id: 'node-order-db',
    type: 'customService',
    position: { x: 500, y: 270 },
    data: { name: 'Order PostgreSQL DB', serviceType: 'Database', endpoint: 'http://localhost:4000/api/mock/database', hits: 0, status: 'idle', statusLabel: 'IDLE' }
  },
  {
    id: 'node-payment',
    type: 'customService',
    position: { x: 760, y: 180 },
    data: { name: 'Stripe Payment Processor', serviceType: 'Service', endpoint: 'http://localhost:4000/api/mock/payment', hits: 0, status: 'idle', statusLabel: 'IDLE' }
  }
];

const ECOMMERCE_EDGES = [
  { id: 'edge-client-gw', source: 'node-client', target: 'node-gateway', type: 'animatedFlow', data: { isFlowing: false, status: 'idle', particleCount: 3 } },
  { id: 'edge-gw-auth', source: 'node-gateway', target: 'node-auth', type: 'animatedFlow', data: { isFlowing: false, status: 'idle', particleCount: 3 } },
  { id: 'edge-gw-db', source: 'node-gateway', target: 'node-order-db', type: 'animatedFlow', data: { isFlowing: false, status: 'idle', particleCount: 3 } },
  { id: 'edge-db-payment', source: 'node-order-db', target: 'node-payment', type: 'animatedFlow', data: { isFlowing: false, status: 'idle', particleCount: 3 } }
];

// 2. Bottleneck & Chaos Detection Pipeline
const CHAOS_NODES = [
  {
    id: 'node-c-client',
    type: 'customService',
    position: { x: 40, y: 180 },
    data: { name: 'Mobile App', serviceType: 'Client', endpoint: '', hits: 0, status: 'idle', statusLabel: 'IDLE' }
  },
  {
    id: 'node-c-gateway',
    type: 'customService',
    position: { x: 250, y: 180 },
    data: { name: 'Edge Gateway (Fast)', serviceType: 'API', endpoint: 'http://localhost:4000/api/mock/gateway', hits: 0, status: 'idle', statusLabel: 'IDLE' }
  },
  {
    id: 'node-c-cache',
    type: 'customService',
    position: { x: 480, y: 80 },
    data: { name: 'Redis Cache (Fast)', serviceType: 'Database', endpoint: 'http://localhost:4000/api/mock/cache', hits: 0, status: 'idle', statusLabel: 'IDLE' }
  },
  {
    id: 'node-c-slow',
    type: 'customService',
    position: { x: 480, y: 270 },
    data: { name: 'Legacy ERP (Slow 280ms)', serviceType: 'Server', endpoint: 'http://localhost:4000/api/mock/slow', hits: 0, status: 'idle', statusLabel: 'IDLE' }
  },
  {
    id: 'node-c-flaky',
    type: 'customService',
    position: { x: 740, y: 270 },
    data: { name: 'Vendor API (Flaky 30% Err)', serviceType: 'Service', endpoint: 'http://localhost:4000/api/mock/flaky', hits: 0, status: 'idle', statusLabel: 'IDLE' }
  }
];

const CHAOS_EDGES = [
  { id: 'edge-c-client-gw', source: 'node-c-client', target: 'node-c-gateway', type: 'animatedFlow', data: { isFlowing: false, status: 'idle', particleCount: 3 } },
  { id: 'edge-c-gw-cache', source: 'node-c-gateway', target: 'node-c-cache', type: 'animatedFlow', data: { isFlowing: false, status: 'idle', particleCount: 3 } },
  { id: 'edge-c-gw-slow', source: 'node-c-gateway', target: 'node-c-slow', type: 'animatedFlow', data: { isFlowing: false, status: 'idle', particleCount: 3 } },
  { id: 'edge-c-slow-flaky', source: 'node-c-slow', target: 'node-c-flaky', type: 'animatedFlow', data: { isFlowing: false, status: 'idle', particleCount: 3 } }
];

// 3. User Authentication & Session Token
const AUTH_NODES = [
  {
    id: 'node-a-client',
    type: 'customService',
    position: { x: 50, y: 180 },
    data: { name: 'Single Page App', serviceType: 'Client', endpoint: '', hits: 0, status: 'idle', statusLabel: 'IDLE' }
  },
  {
    id: 'node-a-gw',
    type: 'customService',
    position: { x: 280, y: 180 },
    data: { name: 'Auth Gateway', serviceType: 'API', endpoint: 'http://localhost:4000/api/mock/gateway', hits: 0, status: 'idle', statusLabel: 'IDLE' }
  },
  {
    id: 'node-a-verifier',
    type: 'customService',
    position: { x: 520, y: 180 },
    data: { name: 'JWT Verifier Service', serviceType: 'Service', endpoint: 'http://localhost:4000/api/mock/auth', hits: 0, status: 'idle', statusLabel: 'IDLE' }
  },
  {
    id: 'node-a-session',
    type: 'customService',
    position: { x: 760, y: 180 },
    data: { name: 'Redis Session Store', serviceType: 'Database', endpoint: 'http://localhost:4000/api/mock/cache', hits: 0, status: 'idle', statusLabel: 'IDLE' }
  }
];

const AUTH_EDGES = [
  { id: 'edge-a-1', source: 'node-a-client', target: 'node-a-gw', type: 'animatedFlow', data: { isFlowing: false, status: 'idle', particleCount: 3 } },
  { id: 'edge-a-2', source: 'node-a-gw', target: 'node-a-verifier', type: 'animatedFlow', data: { isFlowing: false, status: 'idle', particleCount: 3 } },
  { id: 'edge-a-3', source: 'node-a-verifier', target: 'node-a-session', type: 'animatedFlow', data: { isFlowing: false, status: 'idle', particleCount: 3 } }
];

const DEFAULT_FLOWS = [
  {
    id: 'flow-ecommerce',
    name: 'E-Commerce Order Pipeline',
    baseUrl: 'http://localhost:4000',
    nodes: ECOMMERCE_NODES,
    edges: ECOMMERCE_EDGES
  },
  {
    id: 'flow-chaos',
    name: 'Bottleneck & Chaos Detection',
    baseUrl: 'http://localhost:4000',
    nodes: CHAOS_NODES,
    edges: CHAOS_EDGES
  },
  {
    id: 'flow-auth',
    name: 'User Auth & Session Store',
    baseUrl: 'http://localhost:4000',
    nodes: AUTH_NODES,
    edges: AUTH_EDGES
  }
];

function loadConfig() {
  const filePath = getConfigPath();
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);

      let flows = parsed.flows;
      if (!Array.isArray(flows) || flows.length === 0) {
        flows = DEFAULT_FLOWS;
      }

      const activeFlowId = parsed.activeFlowId || flows[0].id;
      const currentFlow = flows.find(f => f.id === activeFlowId) || flows[0];

      return {
        flows,
        activeFlowId: currentFlow.id,
        nodes: currentFlow.nodes || ECOMMERCE_NODES,
        edges: currentFlow.edges || ECOMMERCE_EDGES,
        baseUrl: currentFlow.baseUrl || 'http://localhost:4000',
        exists: true
      };
    } catch (err) {
      console.warn(`[FlowCheck] Warning: Failed to parse ${CONFIG_FILENAME}, falling back to defaults. Error: ${err.message}`);
    }
  }

  return {
    flows: DEFAULT_FLOWS,
    activeFlowId: 'flow-ecommerce',
    nodes: ECOMMERCE_NODES,
    edges: ECOMMERCE_EDGES,
    baseUrl: 'http://localhost:4000',
    exists: false
  };
}

function saveConfig(payload = {}) {
  const filePath = getConfigPath();
  
  let flows = payload.flows;
  if (!Array.isArray(flows) || flows.length === 0) {
    flows = [
      {
        id: payload.activeFlowId || 'flow-ecommerce',
        name: 'Main Pipeline',
        baseUrl: payload.baseUrl || 'http://localhost:4000',
        nodes: payload.nodes || ECOMMERCE_NODES,
        edges: payload.edges || ECOMMERCE_EDGES
      }
    ];
  }

  const activeFlowId = payload.activeFlowId || flows[0].id;
  const currentFlow = flows.find(f => f.id === activeFlowId) || flows[0];

  const toSave = {
    activeFlowId,
    flows,
    nodes: currentFlow.nodes,
    edges: currentFlow.edges,
    baseUrl: currentFlow.baseUrl,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(filePath, JSON.stringify(toSave, null, 2), 'utf8');
  return { status: 'saved', path: filePath, activeFlowId };
}

module.exports = {
  loadConfig,
  saveConfig,
  getConfigPath,
  DEFAULT_FLOWS
};
