#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { startServer } = require('../server/index');
const { getConfigPath } = require('../server/configManager');

const PORT = parseInt(process.env.PORT, 10) || 4000;
const URL = `http://localhost:${PORT}`;

async function main() {
  console.log('\n========================================');
  console.log('       ⚡ FLOWCHECK LOAD RUNNER ⚡       ');
  console.log(' Real-time Flow Visualizer & Load Tester');
  console.log('========================================\n');

  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    console.log(`[Config] Found configuration: ${configPath}`);
  } else {
    console.log(`[Config] No flowcheck.config.json in current directory. Default architecture will be initialized.`);
  }

  try {
    const { server } = await startServer(PORT);
    console.log(`\n🚀 FlowCheck running at ${URL}`);
    console.log(`👉 Press Ctrl+C in this terminal to stop.\n`);

    // Auto open browser
    try {
      const open = require('open');
      await open(URL);
    } catch (err) {
      // Fallback cross-platform command
      const { exec } = require('child_process');
      const startCmd = process.platform === 'darwin' ? 'open' :
                       process.platform === 'win32' ? 'start' : 'xdg-open';
      exec(`${startCmd} ${URL}`);
    }

    // Graceful shutdown
    const cleanup = () => {
      console.log('\n[FlowCheck] Shutting down server gracefully...');
      server.close(() => {
        console.log('[FlowCheck] Server stopped. Goodbye!');
        process.exit(0);
      });
      // Force exit after 3 seconds if hanging
      setTimeout(() => process.exit(0), 3000);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
      console.error(`Try setting a different port with: PORT=4001 flowcheck\n`);
    } else {
      console.error(`\n❌ Failed to start FlowCheck server:`, err.message);
    }
    process.exit(1);
  }
}

main();
