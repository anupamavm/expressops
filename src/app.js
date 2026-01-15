const express = require("express");
const healthRoutes = require("./routes/health");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", healthRoutes);

// Error handling middleware (must be last)
app.use(errorMiddleware);

module.exports = app;
