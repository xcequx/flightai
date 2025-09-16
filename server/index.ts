import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { ensureSchema } from './db.js';
import flightRoutes from './routes/flights.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json());

// Initialize database schema on startup
await ensureSchema();

// Routes
app.use('/api/flights', flightRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});