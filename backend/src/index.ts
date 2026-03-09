// StackLens API - Main Entry Point
// Stacking Analytics & Yield Intelligence Dashboard

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { serve } from '@hono/node-server';

import { config } from './config/index.js';
import { stackingRoutes } from './routes/stacking.routes.js';
import { simulatorRoutes } from './routes/simulator.routes.js';

// Initialize Hono app
const app = new Hono();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Enable CORS for frontend
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-Request-Id'],
  maxAge: 86400,
}));

// Request logging
app.use('*', logger());

// Pretty JSON responses in development
app.use('*', prettyJSON());

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'StackLens API',
    version: '1.0.0',
    description: 'Stacking Analytics & Yield Intelligence for Stacks',
    network: config.network,
    endpoints: {
      health: '/',
      stacking: '/api/v1/stacking/*',
      simulator: '/api/v1/simulator/*',
    },
  });
});

// API health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    network: config.network,
  });
});

// Mount route groups
app.route('/api/v1/stacking', stackingRoutes);
app.route('/api/v1/simulator', simulatorRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({
    success: false,
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  }, 500);
});

app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    path: c.req.path,
    timestamp: new Date().toISOString(),
  }, 404);
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const port = config.port;
const host = config.host;

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███████╗████████╗ █████╗  ██████╗██╗  ██╗                  ║
║   ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝                  ║
║   ███████╗   ██║   ███████║██║     █████╔╝                   ║
║   ╚════██║   ██║   ██╔══██║██║     ██╔═██╗                   ║
║   ███████║   ██║   ██║  ██║╚██████╗██║  ██╗                  ║
║   ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝                  ║
║                                                               ║
║   ██╗     ███████╗███╗   ██╗███████╗                         ║
║   ██║     ██╔════╝████╗  ██║██╔════╝                         ║
║   ██║     █████╗  ██╔██╗ ██║███████╗                         ║
║   ██║     ██╔══╝  ██║╚██╗██║╚════██║                         ║
║   ███████╗███████╗██║ ╚████║███████║                         ║
║   ╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝                         ║
║                                                               ║
║   Stacking Analytics & Yield Intelligence                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

🚀 Server starting...
📡 Network: ${config.network}
🌐 URL: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}
`);

serve({
  fetch: app.fetch,
  port,
  hostname: host,
}, (info) => {
  console.log(`✅ StackLens API running at http://localhost:${info.port}`);
  console.log(`
📚 Available Endpoints:
  
  Stacking Analytics:
    GET  /api/v1/stacking/pox           - PoX information
    GET  /api/v1/stacking/stats         - Stacking statistics
    GET  /api/v1/stacking/cycle         - Current reward cycle
    GET  /api/v1/stacking/account/:addr - Account stacking info
    GET  /api/v1/stacking/rewards/:addr - Stacking rewards history
    GET  /api/v1/stacking/pox-txs/:blk  - PoX Bitcoin transactions
  
  Reward Simulator:
    POST /api/v1/simulator/simulate     - Simulate BTC rewards
    GET  /api/v1/simulator/simulate     - Simulate (query params)
    POST /api/v1/simulator/pool         - Simulate with pool fees
    POST /api/v1/simulator/compare      - Compare solo vs pool
    POST /api/v1/simulator/required-stx - Calculate required STX
    GET  /api/v1/simulator/projections  - Yield projections
`);
});

export default app;
