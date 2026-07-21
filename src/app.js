require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// IMPORT ALL SERVICES
// ============================================================
const VirusTotalService = require('./services/virustotal.service');
const AbuseIPDBService = require('./services/abuseipdb.service');
const ShodanService = require('./services/shodan.service');
const OTXService = require('./services/otx.service');
const GroqService = require('./services/groq.service');
const CacheService = require('./services/cache.service');
const LoggerService = require('./services/logger.service');
const URLScanService = require('./services/urlscan.service');
const ASNService = require('./services/asn.service');
const SubdomainService = require('./services/subdomain.service');
const WhoisService = require('./services/whois.service');
const DNSService = require('./services/dns.service');
const SSLService = require('./services/ssl.service');
const GeolocationService = require('./services/geolocation.service');
const CTService = require('./services/certificate-transparency.service');
const MitreService = require('./services/mitre.service');
const ActorService = require('./services/actor.service');

// ============================================================
// MIDDLEWARE IMPORTS & SETUP
// ============================================================
const { requestLogger } = require('./middleware/logger');
const limiter = require('./middleware/rate-limit');
const { errorHandler, notFound } = require('./middleware/error-handler');
const { validateExternalAPI } = require('./middleware/auth');
const exportRoutes = require('./routes/export.routes');

app.use(requestLogger);
app.use(validateExternalAPI);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Allow all origins for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Apply rate limiter to API endpoints
app.use('/api/', limiter);

// Mount modular export routes
app.use('/api/export', exportRoutes);

// ============================================================
// MITRE ATT&CK SYNC ROUTE
// ============================================================
app.post('/api/mitre/sync', async (req, res) => {
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
// Serve frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================================
// API ROUTES
// ============================================================

// Health
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        apis: {
            virustotal: !!process.env.VIRUSTOTAL_API_KEY,
            abuseipdb: !!process.env.ABUSEIPDB_API_KEY,
            shodan: !!process.env.SHODAN_API_KEY,
            otx: !!process.env.OTX_API_KEY,
            urlscan: !!process.env.URLSCAN_API_KEY,
            groq: !!process.env.GROQ_API_KEY
        },
        cache: CacheService.getStats ? CacheService.getStats() : 'Cache not initialized'
    });
});

// API Home
app.get('/api', (req, res) => {
    res.json({
        name: 'Threat Intel Workbench Pro',
        version: '2.0.0',
        status: 'operational',
        endpoints: {
            ip: '/api/investigate/ip/:ip',
            domain: '/api/investigate/domain/:domain',
            hash: '/api/investigate/hash/:hash',
            url: '/api/investigate/url?url=...',
            batch: '/api/investigate/batch (POST)',
            health: '/health',
            history: '/api/history'
        }
    });
});

// ============================================================
// IP INVESTIGATION
// ============================================================
app.get('/api/investigate/ip/:ip', async (req, res) => {
    try {
        const ip = req.params.ip;
        const startTime = Date.now();

        const cacheKey = `ip:${ip}`;
        const cached = CacheService.get ? CacheService.get(cacheKey) : null;
        if (cached) {
            return res.json({ success: true, cached: true, data: cached });
        }

        const [vt, abuse, shodan, otx, geo, asn] = await Promise.all([
            VirusTotalService.investigateIP(ip).catch(err => ({ success: false, error: err.message, provider: 'virustotal' })),
            AbuseIPDBService.investigateIP(ip).catch(err => ({ success: false, error: err.message, provider: 'abuseipdb' })),
            ShodanService.investigateIP(ip).catch(err => ({ success: false, error: err.message, provider: 'shodan' })),
            OTXService.investigateIP(ip).catch(err => ({ success: false, error: err.message, provider: 'otx' })),
            GeolocationService.getLocation(ip).catch(err => ({ success: false, error: err.message, provider: 'geolocation' })),
            ASNService.getASN(ip).catch(err => ({ success: false, error: err.message, provider: 'asn' }))
        ]);

        let riskScore = 0;
        let activeSources = 0;
        if (vt.success) { riskScore += (vt.detections || 0) * 2; activeSources++; }
        if (abuse.success) { riskScore += (abuse.abuse_score || 0) * 0.5; activeSources++; }
        if (shodan.success) { riskScore += (shodan.vulnerabilities?.length || 0) * 5; activeSources++; }
        if (otx.success) { riskScore += (otx.pulses || 0) * 5; activeSources++; }
        riskScore = Math.min(Math.round(riskScore), 100);

        let verdict, color;
        if (riskScore >= 80) { verdict = 'CRITICAL'; color = '#ef4444'; }
        else if (riskScore >= 60) { verdict = 'HIGH'; color = '#f59e0b'; }
        else if (riskScore >= 30) { verdict = 'MEDIUM'; color = '#3b82f6'; }
        else { verdict = 'LOW'; color = '#22c55e'; }
        const confidence = Math.round((activeSources / 6) * 100);

        const findings = [];
        if (vt.success) findings.push(`VirusTotal: ${vt.detections} detections (${vt.ratio})`);
        if (abuse.success) findings.push(`AbuseIPDB: ${abuse.abuse_score}% abuse score`);
        if (shodan.success && shodan.vulnerabilities?.length) findings.push(`Shodan: ${shodan.vulnerabilities.length} vulnerabilities`);
        if (otx.success && otx.pulses) findings.push(`OTX: ${otx.pulses} threat pulses`);
        if (geo.success) findings.push(`Location: ${geo.country}, ${geo.city || 'N/A'}`);
        if (asn.success) findings.push(`ASN: ${asn.asn} (${asn.as_name})`);

        const mappedTechniques = await MitreService.mapTechniques({ virustotal: vt, abuseipdb: abuse, shodan: shodan, otx: otx });
        const actorData = await ActorService.getActorByIOC({ providers: { virustotal: vt, abuseipdb: abuse, shodan: shodan, otx: otx }, mitre: mappedTechniques });

        const assessment = {
            score: riskScore,
            risk: verdict,
            verdict: verdict,
            confidence: confidence,
            sourcesResponded: activeSources,
            totalSources: 6,
            findings: findings.length ? findings : ['No threats detected'],
            attackTechniques: mappedTechniques,
            actor: actorData
        };

        let aiSummary = null;
        if (GroqService && GroqService.generateAnalystSummary) {
            try {
                const result = await GroqService.generateAnalystSummary('ip', ip, assessment);
                if (result && !result.error) aiSummary = result;
            } catch (err) { console.error('Groq AI Error:', err.message); }
        }

        const response = {
            ioc: { type: 'ip', value: ip },
            risk: {
                score: riskScore,
                verdict: verdict,
                color: color,
                confidence: confidence,
                sources: activeSources,
                total_sources: 6
            },
            ai_summary: aiSummary,
            providers: { virustotal: vt, abuseipdb: abuse, shodan: shodan, otx: otx },
            enrichment: {
                geolocation: geo.success ? geo : null,
                asn: asn.success ? asn : null,
                mitre: mappedTechniques,
                actor: actorData
            },
            processing_time: `${Date.now() - startTime}ms`,
            timestamp: new Date().toISOString(),
            investigation_id: `inv_${Date.now()}`
        };

        if (CacheService.set) CacheService.set(cacheKey, response);
        if (LoggerService.logInvestigation) {
            LoggerService.logInvestigation({
                ioc: ip,
                type: 'ip',
                risk_score: riskScore,
                verdict: verdict,
                sources: activeSources,
                timestamp: new Date().toISOString()
            });
        }

        res.json({ success: true, cached: false, data: response });
    } catch (error) {
        console.error('IP Investigation Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// DOMAIN INVESTIGATION
// ============================================================
app.get('/api/investigate/domain/:domain', async (req, res) => {
    try {
        const domain = req.params.domain;
        const startTime = Date.now();

        const [vt, otx, whois, dns, ssl, ct, subdomains] = await Promise.all([
            VirusTotalService.investigateDomain(domain).catch(err => ({ success: false, error: err.message })),
            OTXService.investigateDomain(domain).catch(err => ({ success: false, error: err.message })),
            WhoisService.lookup(domain).catch(err => ({ success: false, error: err.message })),
            DNSService.lookup(domain).catch(err => ({ success: false, error: err.message })),
            SSLService.getCertificate(domain).catch(err => ({ success: false, error: err.message })),
            CTService.getCertificates(domain).catch(err => ({ success: false, error: err.message })),
            SubdomainService.discover(domain).catch(err => ({ success: false, error: err.message }))
        ]);

        let riskScore = 0;
        let activeSources = 0;
        if (vt.success) { riskScore += (vt.detections || 0) * 2; activeSources++; }
        if (otx.success) { riskScore += (otx.pulses || 0) * 5; activeSources++; }
        riskScore = Math.min(Math.round(riskScore), 100);

        let verdict, color;
        if (riskScore >= 80) { verdict = 'CRITICAL'; color = '#ef4444'; }
        else if (riskScore >= 60) { verdict = 'HIGH'; color = '#f59e0b'; }
        else if (riskScore >= 30) { verdict = 'MEDIUM'; color = '#3b82f6'; }
        else { verdict = 'LOW'; color = '#22c55e'; }
        const confidence = Math.round((activeSources / 7) * 100);

        const findings = [];
        if (vt.success) findings.push(`VirusTotal: ${vt.detections} detections (${vt.ratio})`);
        if (otx.success && otx.pulses) findings.push(`OTX: ${otx.pulses} threat pulses`);
        if (whois.success) findings.push(`Registrar: ${whois.registrar || 'N/A'}`);
        if (dns.success) findings.push(`DNS: A records: ${dns.a?.length || 0}, MX: ${dns.mx?.length || 0}`);
        if (ssl.success) findings.push(`SSL: Issued by ${ssl.issuer?.CN || 'N/A'}`);
        if (ct.success && ct.certificates?.length) findings.push(`CT logs: ${ct.certificates.length} certificates found`);
        if (subdomains.success) findings.push(`Subdomains found: ${subdomains.count || 0}`);

        const mappedTechniques = await MitreService.mapTechniques({ virustotal: vt, otx: otx });
        const actorData = await ActorService.getActorByIOC({ providers: { virustotal: vt, otx: otx }, mitre: mappedTechniques });

        const assessment = {
            score: riskScore,
            risk: verdict,
            verdict: verdict,
            confidence: confidence,
            sourcesResponded: activeSources,
            totalSources: 7,
            findings: findings.length ? findings : ['No threats detected'],
            attackTechniques: mappedTechniques,
            actor: actorData
        };

        let aiSummary = null;
        if (GroqService && GroqService.generateAnalystSummary) {
            try {
                const result = await GroqService.generateAnalystSummary('domain', domain, assessment);
                if (result && !result.error) aiSummary = result;
            } catch (err) { console.error('Groq AI Error:', err.message); }
        }

        const response = {
            ioc: { type: 'domain', value: domain },
            risk: {
                score: riskScore,
                verdict: verdict,
                color: color,
                confidence: confidence,
                sources: activeSources,
                total_sources: 7
            },
            ai_summary: aiSummary,
            providers: { virustotal: vt, otx: otx },
            enrichment: {
                whois: whois.success ? whois : null,
                dns: dns.success ? dns : null,
                ssl: ssl.success ? ssl : null,
                certificate_transparency: ct.success ? ct : null,
                subdomains: subdomains.success ? subdomains : null,
                mitre: mappedTechniques,
                actor: actorData
            },
            processing_time: `${Date.now() - startTime}ms`,
            timestamp: new Date().toISOString(),
            investigation_id: `inv_${Date.now()}`
        };

        res.json({ success: true, data: response });
    } catch (error) {
        console.error('Domain Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// HASH INVESTIGATION
// ============================================================
app.get('/api/investigate/hash/:hash', async (req, res) => {
    try {
        const hash = req.params.hash;
        const startTime = Date.now();

        const [vt, otx] = await Promise.all([
            VirusTotalService.investigateHash(hash).catch(err => ({ success: false, error: err.message })),
            OTXService.investigateHash(hash).catch(err => ({ success: false, error: err.message }))
        ]);

        let riskScore = 0;
        let activeSources = 0;
        if (vt.success) { riskScore += (vt.detections || 0) * 2; activeSources++; }
        if (otx.success) { riskScore += (otx.pulses || 0) * 5; activeSources++; }
        riskScore = Math.min(Math.round(riskScore), 100);

        let verdict, color;
        if (riskScore >= 80) { verdict = 'CRITICAL'; color = '#ef4444'; }
        else if (riskScore >= 60) { verdict = 'HIGH'; color = '#f59e0b'; }
        else if (riskScore >= 30) { verdict = 'MEDIUM'; color = '#3b82f6'; }
        else { verdict = 'LOW'; color = '#22c55e'; }
        const confidence = Math.round((activeSources / 2) * 100);

        const findings = [];
        if (vt.success) findings.push(`VirusTotal: ${vt.detections} detections (${vt.ratio})`);
        if (otx.success && otx.pulses) findings.push(`OTX: ${otx.pulses} threat pulses`);

        const mappedTechniques = await MitreService.mapTechniques({ virustotal: vt, otx: otx });
        const actorData = await ActorService.getActorByIOC({ providers: { virustotal: vt, otx: otx }, mitre: mappedTechniques });

        const assessment = {
            score: riskScore,
            risk: verdict,
            verdict: verdict,
            confidence: confidence,
            sourcesResponded: activeSources,
            totalSources: 2,
            findings: findings.length ? findings : ['No threats detected'],
            attackTechniques: mappedTechniques,
            actor: actorData
        };

        let aiSummary = null;
        if (GroqService && GroqService.generateAnalystSummary) {
            try {
                const result = await GroqService.generateAnalystSummary('hash', hash, assessment);
                if (result && !result.error) aiSummary = result;
            } catch (err) { console.error('Groq AI Error:', err.message); }
        }

        const response = {
            ioc: { type: 'hash', value: hash },
            risk: {
                score: riskScore,
                verdict: verdict,
                color: color,
                confidence: confidence,
                sources: activeSources,
                total_sources: 2
            },
            ai_summary: aiSummary,
            providers: { virustotal: vt, otx: otx },
            enrichment: { mitre: mappedTechniques, actor: actorData },
            processing_time: `${Date.now() - startTime}ms`,
            timestamp: new Date().toISOString(),
            investigation_id: `inv_${Date.now()}`
        };

        res.json({ success: true, data: response });
    } catch (error) {
        console.error('Hash Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// URL INVESTIGATION
// ============================================================
app.get('/api/investigate/url', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({ success: false, error: 'Missing "url" query parameter' });
        }
        const startTime = Date.now();

        const cacheKey = `url:${url}`;
        const cached = CacheService.get ? CacheService.get(cacheKey) : null;
        if (cached) {
            return res.json({ success: true, cached: true, data: cached });
        }

        const scanResult = await URLScanService.scan(url);

        let riskScore = 0;
        if (scanResult.success) {
            if (scanResult.verdicts && scanResult.verdicts.malicious) riskScore += 50;
            if (scanResult.verdicts && scanResult.verdicts.phishing) riskScore += 40;
            if (scanResult.verdicts && scanResult.verdicts.benign) riskScore = 0;
        }
        riskScore = Math.min(Math.round(riskScore), 100);

        let verdict, color;
        if (riskScore >= 80) { verdict = 'CRITICAL'; color = '#ef4444'; }
        else if (riskScore >= 60) { verdict = 'HIGH'; color = '#f59e0b'; }
        else if (riskScore >= 30) { verdict = 'MEDIUM'; color = '#3b82f6'; }
        else { verdict = 'LOW'; color = '#22c55e'; }

        const mappedTechniques = await MitreService.mapTechniques({ urlscan: scanResult });
        const actorData = await ActorService.getActorByIOC({ providers: { urlscan: scanResult }, mitre: mappedTechniques });

        const response = {
            ioc: { type: 'url', value: url },
            risk: {
                score: riskScore,
                verdict: verdict,
                color: color,
                confidence: scanResult.success ? 80 : 0,
                sources: scanResult.success ? 1 : 0,
                total_sources: 1
            },
            providers: { urlscan: scanResult },
            enrichment: { mitre: mappedTechniques, actor: actorData },
            processing_time: `${Date.now() - startTime}ms`,
            timestamp: new Date().toISOString(),
            investigation_id: `inv_${Date.now()}`
        };

        if (CacheService.set) CacheService.set(cacheKey, response);
        if (LoggerService.logInvestigation) {
            LoggerService.logInvestigation({
                ioc: url,
                type: 'url',
                risk_score: riskScore,
                verdict: verdict,
                sources: scanResult.success ? 1 : 0,
                timestamp: new Date().toISOString()
            });
        }

        res.json({ success: true, cached: false, data: response });
    } catch (error) {
        console.error('URL Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// BATCH INVESTIGATION
// ============================================================
app.post('/api/investigate/batch', async (req, res) => {
    try {
        const { indicators } = req.body;
        if (!indicators || !Array.isArray(indicators) || indicators.length === 0) {
            return res.status(400).json({ success: false, error: 'Indicators array required' });
        }
        if (indicators.length > 10) {
            return res.status(400).json({ success: false, error: 'Max 10 indicators per batch' });
        }

        const detectType = (value) => {
            if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) return 'ip';
            if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(value)) return 'domain';
            if (/^[a-fA-F0-9]{32}$/.test(value) || /^[a-fA-F0-9]{40}$/.test(value) || /^[a-fA-F0-9]{64}$/.test(value)) return 'hash';
            if (/^https?:\/\//i.test(value)) return 'url';
            return 'unknown';
        };

        const results = await Promise.all(indicators.map(async (item) => {
            const type = detectType(item);
            try {
                let data;
                switch (type) {
                    case 'ip': {
                        const [vt, abuse, shodan, otx, geo, asn] = await Promise.all([
                            VirusTotalService.investigateIP(item).catch(err => ({ success: false, error: err.message })),
                            AbuseIPDBService.investigateIP(item).catch(err => ({ success: false, error: err.message })),
                            ShodanService.investigateIP(item).catch(err => ({ success: false, error: err.message })),
                            OTXService.investigateIP(item).catch(err => ({ success: false, error: err.message })),
                            GeolocationService.getLocation(item).catch(err => ({ success: false, error: err.message })),
                            ASNService.getASN(item).catch(err => ({ success: false, error: err.message }))
                        ]);
                        data = { vt, abuse, shodan, otx, geo, asn };
                        break;
                    }
                    case 'domain': {
                        const [vt, otx, whois, dns, ssl, ct, sub] = await Promise.all([
                            VirusTotalService.investigateDomain(item).catch(err => ({ success: false, error: err.message })),
                            OTXService.investigateDomain(item).catch(err => ({ success: false, error: err.message })),
                            WhoisService.lookup(item).catch(err => ({ success: false, error: err.message })),
                            DNSService.lookup(item).catch(err => ({ success: false, error: err.message })),
                            SSLService.getCertificate(item).catch(err => ({ success: false, error: err.message })),
                            CTService.getCertificates(item).catch(err => ({ success: false, error: err.message })),
                            SubdomainService.discover(item).catch(err => ({ success: false, error: err.message }))
                        ]);
                        data = { vt, otx, whois, dns, ssl, ct, subdomains: sub };
                        break;
                    }
                    case 'hash': {
                        const [vt, otx] = await Promise.all([
                            VirusTotalService.investigateHash(item).catch(err => ({ success: false, error: err.message })),
                            OTXService.investigateHash(item).catch(err => ({ success: false, error: err.message }))
                        ]);
                        data = { vt, otx };
                        break;
                    }
                    case 'url': {
                        const urlscan = await URLScanService.scan(item);
                        data = { urlscan };
                        break;
                    }
                    default:
                        data = { error: 'Unsupported type' };
                }
                return { indicator: item, type, data };
            } catch (err) {
                return { indicator: item, type, error: err.message };
            }
        }));

        const batchSummary = {
            total: indicators.length,
            successful: results.filter(r => !r.error).length,
            failed: results.filter(r => r.error).length,
            types: {
                ip: results.filter(r => r.type === 'ip').length,
                domain: results.filter(r => r.type === 'domain').length,
                hash: results.filter(r => r.type === 'hash').length,
                url: results.filter(r => r.type === 'url').length,
                unknown: results.filter(r => r.type === 'unknown').length
            }
        };

        res.json({
            success: true,
            batch_id: `batch_${Date.now()}`,
            summary: batchSummary,
            results
        });
    } catch (error) {
        console.error('Batch Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// HISTORY
// ============================================================
app.get('/api/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const history = LoggerService.getInvestigationHistory ? LoggerService.getInvestigationHistory(limit) : [];
    res.json({
        success: true,
        count: history.length,
        limit: limit,
        data: history
    });
});

// ============================================================
// CATCH-ALL: Serve index.html for SPA (AFTER API ROUTES)
// ============================================================
app.get('*', (req, res) => {
    // Skip API routes (already handled above)
    if (req.path.startsWith('/api/') || req.path === '/health') {
        return res.status(404).json({ error: 'Not found' });
    }
    // Return 404 for missing static assets instead of serving index.html
    if (req.path.startsWith('/js/') || req.path.startsWith('/css/') || req.path.startsWith('/assets/') || /\.(js|css|png|jpg|jpeg|gif|svg|ico|json|woff|woff2|ttf|eot)$/i.test(req.path)) {
        return res.status(404).send('Static asset not found');
    }
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ============================================================
// ERROR HANDLING
// ============================================================
app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log('========================================');
    console.log('🛡️  Threat Intel Workbench Pro');
    console.log('========================================');
    console.log(`🔗 Server:      http://localhost:${PORT}`);
    console.log(`📡 API:         http://localhost:${PORT}/api`);
    console.log(`🏥 Health:      http://localhost:${PORT}/health`);
    console.log(`🌐 Frontend:    http://localhost:${PORT}`);
    console.log('========================================');
    console.log('📌  API Status:');
    console.log(`   ✅ VirusTotal:  ${process.env.VIRUSTOTAL_API_KEY ? '✅' : '❌'}`);
    console.log(`   ✅ AbuseIPDB:   ${process.env.ABUSEIPDB_API_KEY ? '✅' : '❌'}`);
    console.log(`   ✅ Shodan:      ${process.env.SHODAN_API_KEY ? '✅' : '❌'}`);
    console.log(`   ✅ OTX:         ${process.env.OTX_API_KEY ? '✅' : '❌'}`);
    console.log(`   ✅ URLScan:     ${process.env.URLSCAN_API_KEY ? '✅' : '❌'}`);
    console.log(`   ✅ Groq:        ${process.env.GROQ_API_KEY ? '✅' : '❌'}`);
    console.log('========================================');
    console.log('💡  Press Ctrl+C to stop');
    console.log('========================================');
});