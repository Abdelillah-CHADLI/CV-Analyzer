// Importing required packages
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Creating express application
const app = express();

// Getting port from environment variables or use 3001 if not specified
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "CV Analyzer API is running",
    timestamp: new Date().toISOString(),
  });
});

// Test route
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    data: {
      name: "Test Endpoint",
      description: "This is a test route",
    },
  });
});

// Error test route (.status(500) for server error, 404 not found, 400 bad request(client error), 200 success)
app.get("/api/error", (req, res) => {
  res.status(500).json({
    success: false,
    error: "This is a test error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost: ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
