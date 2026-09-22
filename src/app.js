require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { version } = require('../package.json');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// SERVICES & UTILS
// ============================================================
const MitreService = require('./services/mitre.service');

// ============================================================
// MIDDLEWARE IMPORTS
// ============================================================
const { requestLogger } = require('./middleware/logger');
const limiter = require('./middleware/rate-limit');
const { errorHandler } = require('./middleware/error-handler');
const { validateExternalAPI, validateApiKey, isKeyConfigured } = require('./middleware/auth');

// ============================================================
// ROUTE IMPORTS
// ============================================================
const healthRoutes = require('./routes/health.routes');
const investigateRoutes = require('./routes/investigate.routes');
const exportRoutes = require('./routes/export.routes');
const historyRoutes = require('./routes/history.routes');
const aiRoutes = require('./routes/ai.routes');

// ============================================================
// SECURITY & MIDDLEWARE SETUP
// ============================================================
app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(requestLogger);
app.use(validateExternalAPI);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiter to API endpoints
app.use('/api/', limiter);

// ============================================================
// API ROUTES
// ============================================================

// Public API Info
app.get('/api', (req, res) => {
    res.json({
        name: 'Threat Intel Workbench Pro',
        version: version,
        status: 'operational',
        endpoints: {
            ip: '/api/investigate/ip/:ip',
            domain: '/api/investigate/domain/:domain',
            hash: '/api/investigate/hash/:hash',
            url: '/api/investigate/url?url=...',
            batch: '/api/investigate/batch (POST)',
            health: '/health',
            history: '/api/history',
            export: '/api/export'
        }
    });
});

// Modular Routes
app.use('/health', healthRoutes);
app.use('/api/ai', aiRoutes);            // Public: model list — no API key required
app.use('/api/investigate', validateApiKey, investigateRoutes);
app.use('/api/history', validateApiKey, historyRoutes);
app.use('/api/export', validateApiKey, exportRoutes);

// MITRE ATT&CK STIX Sync Route
app.post('/api/mitre/sync', validateApiKey, async (req, res) => {
    try {
        await MitreService.syncSTIXData();
        res.json({ success: true, message: 'MITRE ATT&CK STIX 2.1 dataset synchronization triggered successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================
// FRONTEND STATIC SPA FALLBACK
// ============================================================
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
    if (req.path.startsWith('/api/') || req.path === '/health') {
        return res.status(404).json({ error: 'Not found' });
    }
    if (req.path.startsWith('/js/') || req.path.startsWith('/css/') || req.path.startsWith('/assets/') || /\.(js|css|png|jpg|jpeg|gif|svg|ico|json|woff|woff2|ttf|eot)$/i.test(req.path)) {
        return res.status(404).send('Static asset not found');
    }
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ============================================================
// ERROR HANDLING
// ============================================================
app.use(errorHandler);

module.exports = app;

// ============================================================
// START SERVER (When executed directly)
// ============================================================
if (require.main === module) {
    (async () => {
        let dbStatus = '✗ PostgreSQL Connection Failed';
        let dbErrorDetail = '';
        let dbConfigStr = '';
        
        try {
            const db = require('./models');
            if (db.sequelize) {
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('timeout')), 3000);
                });
                await Promise.race([db.sequelize.authenticate(), timeoutPromise]);
                dbStatus = '✓ PostgreSQL Connected';
                dbConfigStr = `
    Host: ${db.sequelize.config.host}
    Database: ${db.sequelize.config.database}
    User: ${db.sequelize.config.username}`;
            }
        } catch (error) {
            dbErrorDetail = `
    Error: ${error.message}
    Reason: Could not connect to PostgreSQL or timed out.
    Disabled Features: Investigation history, AI chat history, Report logging.`;
        }

        app.listen(PORT, () => {
            console.log('\n=========================================================');
            console.log(' ThreatIntelWorkbench Backend v4');
            console.log('=========================================================\n');
            
            console.log(dbStatus);
            if (dbConfigStr) console.log(dbConfigStr);
            if (dbErrorDetail) console.log(dbErrorDetail);
            
            console.log('');
            console.log(`✓ AI Provider (Groq):    ${isKeyConfigured('GROQ_API_KEY') ? 'Configured' : 'Missing'}`);
            if (isKeyConfigured('GROQ_API_KEY')) {
                const { getDefaultModel } = require('./services/groq.service');
                console.log(`  Default AI Model:      ${getDefaultModel()}`);
            }
            console.log(`✓ VirusTotal API:        ${isKeyConfigured('VIRUSTOTAL_API_KEY') ? 'Configured' : 'Missing'}`);
            console.log(`✓ AbuseIPDB API:         ${isKeyConfigured('ABUSEIPDB_API_KEY') ? 'Configured' : 'Missing'}`);
            console.log(`✓ URLScan API:           ${isKeyConfigured('URLSCAN_API_KEY') ? 'Configured' : 'Missing'}`);
            console.log(`✓ OTX API:               ${isKeyConfigured('OTX_API_KEY') ? 'Configured' : 'Missing'}`);
            console.log(`✓ Shodan API:            ${isKeyConfigured('SHODAN_API_KEY') ? 'Configured' : 'Missing'}`);
            
            console.log('\n✓ Server Started');
            console.log(`    http://localhost:${PORT}`);
            console.log('\n=========================================================\n');
        });
    })();
}