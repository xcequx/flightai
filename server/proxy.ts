import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import { ensureSchema } from './db.js';
import flightRoutes from './routes/flights.js';

const app = express();
const PORT = 5000;

// Initialize database schema on startup
await ensureSchema();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/flights', flightRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Proxy all other requests to Vite dev server
app.use('*', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  ws: true,
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    if (res instanceof express.Response) {
      res.status(500).json({ error: 'Proxy error to Vite dev server' });
    }
  }
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Proxying frontend requests to Vite on port 8080`);
  console.log(`API available at http://localhost:${PORT}/api`);
});