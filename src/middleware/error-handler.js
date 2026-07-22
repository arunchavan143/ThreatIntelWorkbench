// ============================================================
// src/middleware/error-handler.js
// ============================================================

const LoggerService = require('../services/logger.service');

/* eslint-disable-next-line no-unused-vars */
function errorHandler(err, req, res, next) {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    // Log error
    if (LoggerService && LoggerService.logError) {
        LoggerService.logError(err, {
            url: req.url,
            method: req.method,
            body: req.body,
            params: req.params
        });
    }

    res.status(status).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    });
}

function notFound(req, res, next) {
    const err = new Error('Route not found');
    err.status = 404;
    next(err);
}

module.exports = {
    errorHandler,
    notFound
};