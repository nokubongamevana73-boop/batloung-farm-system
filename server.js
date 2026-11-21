require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection, getConnectionStatus, poolConfig } = require('./config/db');

// Import Route Handlers
const supplierRoutes = require('./routes/supplierRoutes');
const fruitRoutes = require('./routes/fruitRoutes');
const stockRoutes = require('./routes/stockRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const saleRoutes = require('./routes/saleRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Import Middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware configuration
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Request logger for development
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    const timestamp = new Date().toISOString().substring(11, 19);
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// System Health and Database Status Endpoint
app.get('/api/health', (req, res) => {
  const connected = getConnectionStatus();
  res.status(connected ? 200 : 503).json({
    status: connected ? 'healthy' : 'degraded',
    service: 'Batloung Farm Distribution System API',
    database: {
      connected,
      host: poolConfig.host,
      database: poolConfig.database,
      port: poolConfig.port
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes Mounting
app.use('/api/suppliers', supplierRoutes);
app.use('/api/fruits', fruitRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports', reportRoutes);

// Catch-all 404 handler for unmatched routes
app.use(notFound);

// Central error handler
app.use(errorHandler);

// Start server function
async function startServer() {
  console.log('===========================================================');
  console.log('   Batloung Farm Distribution System - Node.js Server');
  console.log('===========================================================');

  // Test database connection gracefully on startup
  const dbStatus = await testConnection();

  if (!dbStatus.success) {
    console.warn('[Notice] The server is continuing to run to serve client requests and provide diagnostic error messages.');
  }

  const server = app.listen(PORT, () => {
    console.log(`\n Server is running on: http://localhost:${PORT}`);
    console.log(` Dashboard UI live at : http://localhost:${PORT}/`);
    console.log(` Health status endpoint: http://localhost:${PORT}/api/health\n`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
