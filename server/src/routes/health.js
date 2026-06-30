const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// GET /api/health
router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: dbStatus[dbState] || 'unknown',
    env: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;
