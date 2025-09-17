import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ensureSchema } from './db.js';
import flightRoutes from './routes/flights.js';

dotenv.config();

async function createServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '5000', 10);

  // Initialize database schema on startup
  await ensureSchema();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API routes first - before Vite middleware
  app.use('/api/flights', flightRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    // Development mode - integrate with Vite
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    
    // Use vite's connect instance as middleware
    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);
  } else {
    // Production mode - serve static files
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend available at http://localhost:${PORT}/`);
    console.log(`🔗 API available at http://localhost:${PORT}/api`);
  });
}

createServer().catch(console.error);