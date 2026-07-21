// ============================================================
// src/routes/export.routes.js - Export Router
// ============================================================

const express = require('express');
const router = express.Router();
const CacheService = require('../services/cache.service');

router.post('/json', async (req, res, next) => {
    try {
        const payload = req.body;
        if (!payload || !payload.ioc) {
            return res.status(400).json({ success: false, error: 'Invalid investigation payload' });
        }
        res.setHeader('Content-Disposition', `attachment; filename="threat-intel-${payload.ioc.value || 'report'}-${Date.now()}.json"`);
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(JSON.stringify(payload, null, 2));
    } catch (error) {
        next(error);
    }
});

router.post('/csv', async (req, res, next) => {
    try {
        const payload = req.body;
        if (!payload || !payload.ioc) {
            return res.status(400).json({ success: false, error: 'Invalid investigation payload' });
        }
        const ioc = payload.ioc || {};
        const risk = payload.risk || {};
        const rows = [
            ['Indicator', 'Type', 'Risk Verdict', 'Score', 'Confidence'],
            [ioc.value || '', ioc.type || '', risk.verdict || '', risk.score || 0, risk.confidence || 0]
        ];
        const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        res.setHeader('Content-Disposition', `attachment; filename="threat-intel-${ioc.value || 'report'}-${Date.now()}.csv"`);
        res.setHeader('Content-Type', 'text/csv');
        return res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
