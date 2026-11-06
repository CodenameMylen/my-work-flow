const http = require('http');

const PORT = 5000;

// Database mock sederhana di memory
const products = [
  { id: 1, name: 'MacBook Pro M3', price: 25000000, stock: 12 },
  { id: 2, name: 'Mechanical Keyboard', price: 1200000, stock: 45 },
  { id: 3, name: 'UltraWide Monitor', price: 6500000, stock: 8 }
];

let activeConnections = 0;

const server = http.createServer(async (req, res) => {
  activeConnections++;

  // Set CORS agar bisa diakses dari browser mana saja
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    activeConnections--;
    return;
  }

  // 1. Endpoint Auth (Login/Verifikasi Cepat)
  if (req.url === '/api/auth') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'authenticated', token: 'jwt-mock-token-xyz' }));
    activeConnections--;
    return;
  }

  // 2. Endpoint Katalog Produk (Cepat & Stabil)
  if (req.url === '/api/products') {
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: products }));
    activeConnections--;
    return;
  }

  // 3. Endpoint Checkout / Order (Simulasi proses payment ~60ms)
  if (req.url === '/api/checkout') {
    setTimeout(() => {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'order_created', orderId: `ORD-${Date.now()}` }));
      activeConnections--;
    }, 60);
    return;
  }

  // 4. Endpoint Heavy Query Database (Simulasi Bottleneck jika traffic terlalu padat)
  if (req.url === '/api/heavy-query') {
    // Jika koneksi bersamaan terlalu banyak, server mulai drop
    const delay = Math.min(300, 30 + activeConnections * 5);
    const failRate = activeConnections > 30 ? 0.4 : 0.05;

    setTimeout(() => {
      if (Math.random() < failRate) {
        res.writeHead(503);
        res.end(JSON.stringify({ error: 'Database connection pool exhausted' }));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'success', rowsFetched: 5000 }));
      }
      activeConnections--;
    }, delay);
    return;
  }

  // Fallback 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Route not found' }));
  activeConnections--;
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🛒 Contoh Project API Toko Online Aktif di port ${PORT}!`);
  console.log(`======================================================`);
  console.log(`Endpoint yang siap di-test:`);
  console.log(`👉 http://localhost:${PORT}/api/auth`);
  console.log(`👉 http://localhost:${PORT}/api/products`);
  console.log(`👉 http://localhost:${PORT}/api/checkout`);
  console.log(`👉 http://localhost:${PORT}/api/heavy-query`);
  console.log(`======================================================\n`);
});
