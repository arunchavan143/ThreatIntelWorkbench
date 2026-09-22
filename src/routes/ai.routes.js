// src/routes/ai.routes.js
const express = require('express');
const router = express.Router();
const GroqService = require('../services/groq.service');
const { isKeyConfigured } = require('../middleware/auth');

/**
 * GET /api/ai/models
 * Returns the list of supported AI models and the current default.
 * Public endpoint — no API key required (model IDs are not sensitive).
 */
router.get('/models', (req, res) => {
    const models = GroqService.getSupportedModels();
    const defaultModel = GroqService.getDefaultModel();
    return res.json({
        success: true,
        provider: 'groq',
        default_model: defaultModel,
        models: models.map(m => ({
            id: m.id,
            name: m.name,
            provider: m.provider,
            enabled: m.enabled
        }))
    });
});

/**
 * GET /api/ai/status
 * Returns AI provider configuration status without exposing the API key.
 */
router.get('/status', (req, res) => {
    const configured = isKeyConfigured('GROQ_API_KEY');
    return res.json({
        success: true,
        provider: 'groq',
        configured,
        default_model: GroqService.getDefaultModel(),
        available: configured
    });
});

module.exports = router;
