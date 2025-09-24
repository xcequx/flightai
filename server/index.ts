import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ensureSchema } from './db.js';
import flightRoutes from './routes/flights.js';
import hotelRoutes from './routes/hotels.js';

dotenv.config();

async function createServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '5000', 10);

  // Force production mode to serve static files
  process.env.NODE_ENV = 'production';

  // Initialize database schema on startup
  await ensureSchema();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API routes first - before Vite middleware
  app.use('/api/flights', flightRoutes);
  app.use('/api/hotels', hotelRoutes);
  
  // Import and use vacation routes
  const vacationRoutes = await import('./routes/vacation.js');
  app.use('/api/vacation', vacationRoutes.default);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Vite integration - try/catch to handle issues
  try {
    if (process.env.NODE_ENV !== 'production') {
      // Development mode - integrate with Vite with timeout protection
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: { port: 24678 } // Different port for HMR
        },
        appType: 'spa',
        optimizeDeps: { force: true }
      });
      
      // Add timeout wrapper to prevent hanging
      app.use('/', (req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
          return next();
        }
        
        // Set timeout for non-API routes
        const timeout = setTimeout(() => {
          if (!res.headersSent) {
            res.status(500).send('Request timeout - Vite middleware issue');
          }
        }, 10000);
        
        // Clear timeout when response is sent
        res.on('finish', () => clearTimeout(timeout));
        next();
      });
      
      // Use vite's connect instance as middleware
      app.use(vite.ssrFixStacktrace);
      app.use(vite.middlewares);
    } else {
      // Production mode - serve static files
      app.use(express.static('dist'));
      
      // Handle client-side routing - serve index.html for non-API routes
      app.use((req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
          return next();
        }
        // For all other routes, serve the React app
        res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
      });
    }
  } catch (error) {
    console.error('Vite setup failed:', error);
    // Fallback: serve basic HTML response
    app.use('/', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.send('<html><body><h1>FlightAI - Server running but frontend build needed</h1><p>Run: bun run build</p></body></html>');
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend available at http://localhost:${PORT}/`);
    console.log(`🔗 API available at http://localhost:${PORT}/api`);
  });
}

createServer().catch(console.error);