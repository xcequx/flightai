import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import { spawn } from 'child_process';
import { ensureSchema } from './db.js';
import flightRoutes from './routes/flights.js';

const app = express();
const PORT = 5000;

// Start Vite dev server as child process on port 8080
console.log('Starting Vite dev server...');
const viteProcess = spawn('npx', ['vite', '--port', '8080', '--host', '::'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

// Handle Vite process errors
viteProcess.on('error', (err) => {
  console.error('Failed to start Vite dev server:', err);
});

viteProcess.on('exit', (code) => {
  console.log(`Vite dev server exited with code ${code}`);
});

// Wait a moment for Vite to start up
await new Promise(resolve => setTimeout(resolve, 2000));

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
app.use('/', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  ws: true
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Proxying frontend requests to Vite on port 8080`);
  console.log(`API available at http://localhost:${PORT}/api`);
});