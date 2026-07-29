const express = require('express');
const router = express.Router();
const CacheService = require('../services/cache.service');
const { isKeyConfigured } = require('../middleware/auth');
const db = require('../models');

router.get('/', async (req, res) => {
    const cacheStats = CacheService.getStats ? CacheService.getStats() : 'Cache not initialized';
    
    let dbStatus = 'disconnected';
    let overallStatus = 'healthy';
    
    try {
        if (db.sequelize) {
            // Check DB connectivity with a 2 second timeout
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
            await Promise.race([db.sequelize.authenticate(), timeoutPromise]);
            dbStatus = 'connected';
        }
    } catch (error) {
        dbStatus = 'disconnected';
        overallStatus = 'degraded';
        console.error('Database health check failed:', error.message);
    }

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
        apis: {
            virustotal: isKeyConfigured('VIRUSTOTAL_API_KEY'),
            abuseipdb: isKeyConfigured('ABUSEIPDB_API_KEY'),
            shodan: isKeyConfigured('SHODAN_API_KEY'),
            otx: isKeyConfigured('OTX_API_KEY'),
            urlscan: isKeyConfigured('URLSCAN_API_KEY'),
            groq: isKeyConfigured('GROQ_API_KEY')
        }
    });
});

module.exports = router;