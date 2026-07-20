const express = require('express');
const router = express.Router();
const LoggerService = require('../services/logger.service');

// Get investigation history
router.get('/', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const history = LoggerService.getInvestigationHistory(limit);

    res.json({
        success: true,
        count: history.length,
        limit: limit,
        data: history
    });
});

// Get specific investigation
router.get('/:id', (req, res) => {
    const id = req.params.id;
    const history = LoggerService.getInvestigationHistory(1000);
    const investigation = history.find(h => h.investigation_id === id || h.ioc === id);

    if (!investigation) {
        return res.status(404).json({
            success: false,
            error: 'Investigation not found'
        });
    }

    res.json({
        success: true,
        data: investigation
    });
});

module.exports = router;