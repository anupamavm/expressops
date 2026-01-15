const express = require('express');
const healthRoutes = require('./routes/health');
const calculatorRoutes = require('./routes/calculator');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRoutes);
app.use('/api', calculatorRoutes);

// Error handling middleware (must be last)
app.use(errorMiddleware);

module.exports = app;
