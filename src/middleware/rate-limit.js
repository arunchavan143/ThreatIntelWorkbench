// ============================================================
// src/middleware/rate-limit.js
// ============================================================

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000,
    max: process.env.RATE_LIMIT_MAX || 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = limiter;