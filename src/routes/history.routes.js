const express = require('express');
const router = express.Router();
const LoggerService = require('../services/logger.service');

// Get investigation history
router.get('/', async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const history = await LoggerService.getInvestigationHistoryAsync(limit);

    res.json({
        success: true,
        count: history.length,
        limit: limit,
        data: history
    });
});

// Get specific investigation
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const history = await LoggerService.getInvestigationHistoryAsync(1000);
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

const GroqService = require('../services/groq.service');

// AI Natural Language Search over history
router.post('/ai-search', async (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
        return res.status(400).json({ success: false, error: 'Query string required for AI search' });
    }
    const history = await LoggerService.getInvestigationHistoryAsync(100);
    const result = await GroqService.searchNaturalLanguage(query, history);
    res.json(result);
});

module.exports = router;