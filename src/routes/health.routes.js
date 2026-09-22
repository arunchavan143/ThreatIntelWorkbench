const express = require('express');
const router = express.Router();
const CacheService = require('../services/cache.service');
const { isKeyConfigured } = require('../middleware/auth');
const db = require('../models');
const GroqService = require('../services/groq.service');

router.get('/', async (req, res) => {
    const cacheStats = CacheService.getStats ? CacheService.getStats() : 'Cache not initialized';
    
    let dbStatus = 'disconnected';
    let overallStatus = 'healthy';
    
    try {
        if (db.sequelize) {
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('timeout')), 2000);
            });
            await Promise.race([db.sequelize.authenticate(), timeoutPromise]).finally(() => clearTimeout(timeoutId));
            dbStatus = 'connected';
        }
    } catch (error) {
        dbStatus = 'disconnected';
        overallStatus = 'degraded';
        console.error('Database health check failed:', error.message);
    }

    const groqConfigured = isKeyConfigured('GROQ_API_KEY');
    res.json({
        status: overallStatus,
        database: dbStatus,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        system: {
            memory: process.memoryUsage(),
            cpu: process.cpuUsage()
        },
        cache: cacheStats,
        ai: {
            provider: 'groq',
            configured: groqConfigured,
            default_model: groqConfigured ? GroqService.getDefaultModel() : null
        },
        apis: {
            virustotal: isKeyConfigured('VIRUSTOTAL_API_KEY'),
            abuseipdb: isKeyConfigured('ABUSEIPDB_API_KEY'),
            shodan: isKeyConfigured('SHODAN_API_KEY'),
            otx: isKeyConfigured('OTX_API_KEY'),
            urlscan: isKeyConfigured('URLSCAN_API_KEY'),
            groq: groqConfigured
        }
    });
});

module.exports = router;