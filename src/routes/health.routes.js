const express = require('express');
const router = express.Router();
const CacheService = require('../services/cache.service');

router.get('/', (req, res) => {
    const cacheStats = CacheService.getStats();

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
            virustotal: !!process.env.VIRUSTOTAL_API_KEY,
            abuseipdb: !!process.env.ABUSEIPDB_API_KEY,
            shodan: !!process.env.SHODAN_API_KEY,
            otx: !!process.env.OTX_API_KEY,
            urlscan: !!process.env.URLSCAN_API_KEY,
            groq: !!process.env.GROQ_API_KEY
        }
    });
});

module.exports = router;