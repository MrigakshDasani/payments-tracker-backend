// src/index.js
// Entry point — sets up Express, middleware, routes

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes          from './routes/auth.js';
import purchaseOrderRoutes from './routes/purchaseOrders.js';
import paymentRoutes       from './routes/payments.js';
import uploadRoutes        from './routes/upload.js';
import vendorRoutes        from './routes/vendor.js';
import { errorHandler }    from './middleware/errorHandler.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request logger (dev) ──────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',             authRoutes);
app.use('/api/purchase-orders',  purchaseOrderRoutes);
app.use('/api/payments',         paymentRoutes);
app.use('/api/upload',           uploadRoutes);
app.use('/api/vendor',           vendorRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    service:   'payments-tracker-api',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ✅  Payments Tracker API running');
  console.log(`  🚀  http://localhost:${PORT}`);
  console.log(`  🏥  http://localhost:${PORT}/health`);
  console.log('');
});
