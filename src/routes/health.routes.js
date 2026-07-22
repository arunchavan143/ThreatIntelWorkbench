const express = require('express');
const router = express.Router();
const CacheService = require('../services/cache.service');
const { isKeyConfigured } = require('../middleware/auth');

router.get('/', (req, res) => {
    const cacheStats = CacheService.getStats ? CacheService.getStats() : 'Cache not initialized';

    res.json({
        status: 'healthy',
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