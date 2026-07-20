// ============================================================
// src/middleware/logger.js
// ============================================================

const LoggerService = require('../services/logger.service');

function requestLogger(req, res, next) {
    const start = Date.now();

    // Log after response
    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            timestamp: new Date().toISOString()
        };

        if (res.statusCode >= 400) {
            if (LoggerService && LoggerService.logError) {
                LoggerService.logError(log, { type: 'request' });
            }
        }

        // Only log non-health checks to console
        if (!req.url.includes('/health')) {
            console.log(`${log.method} ${log.url} → ${log.status} (${log.duration})`);
        }
    });

    next();
}

module.exports = {
    requestLogger
};