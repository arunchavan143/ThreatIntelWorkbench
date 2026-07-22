// ============================================================
// src/routes/investigate.routes.js - Complete Modular Routes
// ============================================================

const express = require('express');
const router = express.Router();

// Services
const VirusTotalService = require('../services/virustotal.service');
const AbuseIPDBService = require('../services/abuseipdb.service');
const ShodanService = require('../services/shodan.service');
const OTXService = require('../services/otx.service');
const URLScanService = require('../services/urlscan.service');
const GeolocationService = require('../services/geolocation.service');
const ASNService = require('../services/asn.service');
const WhoisService = require('../services/whois.service');
const DNSService = require('../services/dns.service');
const SSLService = require('../services/ssl.service');
const CTService = require('../services/certificate-transparency.service');
const SubdomainService = require('../services/subdomain.service');
const MitreService = require('../services/mitre.service');
const ActorService = require('../services/actor.service');
const GroqService = require('../services/groq.service');
const CacheService = require('../services/cache.service');
const LoggerService = require('../services/logger.service');

// Middleware & Utils
const { validateIP, validateDomain, validateHash, validateURL, validateBatch } = require('../middleware/validator');
const { calculateRisk } = require('../utils/risk-calculator');

// Helper for AI summary generation
async function getAISummary(iocType, iocValue, risk, findings, mappedTechniques, actorData) {
    if (!GroqService || !GroqService.generateAnalystSummary) return null;
    try {
        const assessment = {
            score: risk.score,
            risk: risk.verdict,
            verdict: risk.verdict,
            confidence: risk.confidence,
            sourcesResponded: risk.active_sources || risk.sources,
            totalSources: risk.total_sources || risk.sources,
            findings: findings.length ? findings : ['No threats detected'],
            attackTechniques: mappedTechniques,
            actor: actorData
        };
        const result = await GroqService.generateAnalystSummary(iocType, iocValue, assessment);
        if (result && !result.error) return result;
    } catch (err) {
        console.error('Groq AI Error:', err.message);
    }
    return null;
}

// ============================================================
// INVESTIGATE IP
// ============================================================
router.get('/ip/:ip', validateIP, async (req, res, next) => {
    try {
        const ip = req.params.ip;
        const startTime = Date.now();
        const cacheKey = `ip:${ip}`;

        // Check cache
        const cached = CacheService.get ? CacheService.get(cacheKey) : null;
        if (cached) {
            return res.json({ success: true, cached: true, data: cached });
        }

        // Query providers in parallel
        const [vt, abuse, shodan, otx, geo, asn] = await Promise.all([
            VirusTotalService.investigateIP(ip).catch(err => ({ success: false, error: err.message, provider: 'virustotal' })),
            AbuseIPDBService.investigateIP(ip).catch(err => ({ success: false, error: err.message, provider: 'abuseipdb' })),
            ShodanService.investigateIP(ip).catch(err => ({ success: false, error: err.message, provider: 'shodan' })),
            OTXService.investigateIP(ip).catch(err => ({ success: false, error: err.message, provider: 'otx' })),
            GeolocationService.getLocation(ip).catch(err => ({ success: false, error: err.message, provider: 'geolocation' })),
            ASNService.getASN(ip).catch(err => ({ success: false, error: err.message, provider: 'asn' }))
        ]);

        const results = { vt, abuse, shodan, otx };
        const risk = calculateRisk(results, { type: 'ip', value: ip });

        const findings = [];
        if (vt.success) findings.push(`VirusTotal: ${vt.detections} detections (${vt.ratio})`);
        if (abuse.success) findings.push(`AbuseIPDB: ${abuse.abuse_score}% abuse score`);
        if (shodan.success && shodan.vulnerabilities?.length) findings.push(`Shodan: ${shodan.vulnerabilities.length} vulnerabilities`);
        if (otx.success && otx.pulses) findings.push(`OTX: ${otx.pulses} threat pulses`);
        if (geo.success) findings.push(`Location: ${geo.country}, ${geo.city || 'N/A'}`);
        if (asn.success) findings.push(`ASN: ${asn.asn} (${asn.as_name || 'N/A'})`);

        const mappedTechniques = await MitreService.mapTechniques({ virustotal: vt, abuseipdb: abuse, shodan: shodan, otx: otx });
        const actorData = await ActorService.getActorByIOC({ providers: { virustotal: vt, abuseipdb: abuse, shodan: shodan, otx: otx }, mitre: mappedTechniques });

        const aiSummary = await getAISummary('ip', ip, risk, findings, mappedTechniques, actorData);

        const response = {
            ioc: { type: 'ip', value: ip },
            risk: {
                ...risk,
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
                risk_score: risk.score,
                verdict: risk.verdict,
                sources: risk.active_sources,
                timestamp: new Date().toISOString()
            });
        }

        res.json({ success: true, cached: false, data: response });
    } catch (error) {
        if (LoggerService.logError) LoggerService.logError(error, { endpoint: '/ip/:ip', params: req.params });
        next(error);
    }
});

// ============================================================
// INVESTIGATE DOMAIN
// ============================================================
router.get('/domain/:domain', validateDomain, async (req, res, next) => {
    try {
        const domain = req.params.domain;
        const startTime = Date.now();
        const cacheKey = `domain:${domain}`;

        const cached = CacheService.get ? CacheService.get(cacheKey) : null;
        if (cached) {
            return res.json({ success: true, cached: true, data: cached });
        }

        const [vt, otx, whois, dns, ssl, ct, subdomains] = await Promise.all([
            VirusTotalService.investigateDomain(domain).catch(err => ({ success: false, error: err.message, provider: 'virustotal' })),
            OTXService.investigateDomain(domain).catch(err => ({ success: false, error: err.message, provider: 'otx' })),
            WhoisService.lookup(domain).catch(err => ({ success: false, error: err.message, provider: 'whois' })),
            DNSService.lookup(domain).catch(err => ({ success: false, error: err.message, provider: 'dns' })),
            SSLService.getCertificate(domain).catch(err => ({ success: false, error: err.message, provider: 'ssl' })),
            CTService.getCertificates(domain).catch(err => ({ success: false, error: err.message, provider: 'ct' })),
            SubdomainService.discover(domain).catch(err => ({ success: false, error: err.message, provider: 'subdomains' }))
        ]);

        const results = { vt, otx };
        const risk = calculateRisk(results, { type: 'domain', value: domain });

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

        const aiSummary = await getAISummary('domain', domain, risk, findings, mappedTechniques, actorData);

        const response = {
            ioc: { type: 'domain', value: domain },
            risk: {
                ...risk,
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

        if (CacheService.set) CacheService.set(cacheKey, response);
        if (LoggerService.logInvestigation) {
            LoggerService.logInvestigation({
                ioc: domain,
                type: 'domain',
                risk_score: risk.score,
                verdict: risk.verdict,
                sources: risk.active_sources,
                timestamp: new Date().toISOString()
            });
        }

        res.json({ success: true, cached: false, data: response });
    } catch (error) {
        if (LoggerService.logError) LoggerService.logError(error, { endpoint: '/domain/:domain', params: req.params });
        next(error);
    }
});

// ============================================================
// INVESTIGATE HASH
// ============================================================
router.get('/hash/:hash', validateHash, async (req, res, next) => {
    try {
        const hash = req.params.hash.toLowerCase();
        const startTime = Date.now();
        const cacheKey = `hash:${hash}`;

        const cached = CacheService.get ? CacheService.get(cacheKey) : null;
        if (cached) {
            return res.json({ success: true, cached: true, data: cached });
        }

        const [vt, otx] = await Promise.all([
            VirusTotalService.investigateHash(hash).catch(err => ({ success: false, error: err.message, provider: 'virustotal' })),
            OTXService.investigateHash(hash).catch(err => ({ success: false, error: err.message, provider: 'otx' }))
        ]);

        const results = { vt, otx };
        const risk = calculateRisk(results, { type: 'hash', value: hash });

        const findings = [];
        if (vt.success) findings.push(`VirusTotal: ${vt.detections} detections (${vt.ratio})`);
        if (otx.success && otx.pulses) findings.push(`OTX: ${otx.pulses} threat pulses`);

        const mappedTechniques = await MitreService.mapTechniques({ virustotal: vt, otx: otx });
        const actorData = await ActorService.getActorByIOC({ providers: { virustotal: vt, otx: otx }, mitre: mappedTechniques });

        const aiSummary = await getAISummary('hash', hash, risk, findings, mappedTechniques, actorData);

        const response = {
            ioc: { type: 'hash', value: hash },
            risk: {
                ...risk,
                total_sources: 2
            },
            ai_summary: aiSummary,
            providers: { virustotal: vt, otx: otx },
            enrichment: { mitre: mappedTechniques, actor: actorData },
            processing_time: `${Date.now() - startTime}ms`,
            timestamp: new Date().toISOString(),
            investigation_id: `inv_${Date.now()}`
        };

        if (CacheService.set) CacheService.set(cacheKey, response);
        if (LoggerService.logInvestigation) {
            LoggerService.logInvestigation({
                ioc: hash,
                type: 'hash',
                risk_score: risk.score,
                verdict: risk.verdict,
                sources: risk.active_sources,
                timestamp: new Date().toISOString()
            });
        }

        res.json({ success: true, cached: false, data: response });
    } catch (error) {
        if (LoggerService.logError) LoggerService.logError(error, { endpoint: '/hash/:hash', params: req.params });
        next(error);
    }
});

// ============================================================
// INVESTIGATE URL
// ============================================================
router.get('/url', validateURL, async (req, res, next) => {
    try {
        const url = req.query.url || req.params.url;
        const startTime = Date.now();
        const cacheKey = `url:${url}`;

        const cached = CacheService.get ? CacheService.get(cacheKey) : null;
        if (cached) {
            return res.json({ success: true, cached: true, data: cached });
        }

        const scanResult = await URLScanService.scan(url).catch(err => ({ success: false, error: err.message, provider: 'urlscan' }));
        const results = { urlscan: scanResult };
        const risk = calculateRisk(results, { type: 'url', value: url });

        const findings = [];
        if (scanResult.success) {
            if (scanResult.verdicts && scanResult.verdicts.malicious) findings.push('URLScan verdict: MALICIOUS');
            else if (scanResult.verdicts && scanResult.verdicts.phishing) findings.push('URLScan verdict: PHISHING');
            else if (scanResult.verdicts && scanResult.verdicts.benign) findings.push('URLScan verdict: BENIGN');
            if (scanResult.page?.title) findings.push(`Page Title: ${scanResult.page.title}`);
        }

        const mappedTechniques = await MitreService.mapTechniques({ urlscan: scanResult });
        const actorData = await ActorService.getActorByIOC({ providers: { urlscan: scanResult }, mitre: mappedTechniques });

        const aiSummary = await getAISummary('url', url, risk, findings, mappedTechniques, actorData);

        const response = {
            ioc: { type: 'url', value: url },
            risk: {
                ...risk,
                total_sources: 1
            },
            ai_summary: aiSummary,
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
                risk_score: risk.score,
                verdict: risk.verdict,
                sources: risk.active_sources,
                timestamp: new Date().toISOString()
            });
        }

        res.json({ success: true, cached: false, data: response });
    } catch (error) {
        if (LoggerService.logError) LoggerService.logError(error, { endpoint: '/url', query: req.query });
        next(error);
    }
});

// ============================================================
// INVESTIGATE BATCH
// ============================================================
router.post('/batch', validateBatch, async (req, res, next) => {
    try {
        const { indicators } = req.body;

        const detectType = (value) => {
            if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value)) return 'ip';
            if (/^(?:(?:(?:[a-zA-Z0-9][-a-zA-Z0-9]{0,62})?[a-zA-Z0-9]\.)+[a-zA-Z]{2,63})$/.test(value)) return 'domain';
            if (/^[a-fA-F0-9]{32}$/.test(value) || /^[a-fA-F0-9]{40}$/.test(value) || /^[a-fA-F0-9]{64}$/.test(value)) return 'hash';
            if (/^https?:\/\//i.test(value)) return 'url';
            return 'unknown';
        };

        const batchResults = await Promise.all(indicators.map(async (item) => {
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
                        const urlscan = await URLScanService.scan(item).catch(err => ({ success: false, error: err.message }));
                        data = { urlscan };
                        break;
                    }
                    default:
                        data = { error: 'Unsupported indicator type' };
                }
                return { indicator: item, type, data };
            } catch (err) {
                return { indicator: item, type, error: err.message };
            }
        }));

        const batchSummary = {
            total: indicators.length,
            successful: batchResults.filter(r => !r.error && r.data && !r.data.error).length,
            failed: batchResults.filter(r => r.error || (r.data && r.data.error)).length,
            types: {
                ip: batchResults.filter(r => r.type === 'ip').length,
                domain: batchResults.filter(r => r.type === 'domain').length,
                hash: batchResults.filter(r => r.type === 'hash').length,
                url: batchResults.filter(r => r.type === 'url').length,
                unknown: batchResults.filter(r => r.type === 'unknown').length
            }
        };

        const history = await (LoggerService.getInvestigationHistoryAsync ? LoggerService.getInvestigationHistoryAsync(50) : []);
        const batchAiSynthesis = await GroqService.analyzeBatch(batchResults, history);

        res.json({
            success: true,
            batch_id: `batch_${Date.now()}`,
            summary: batchSummary,
            batch_ai_synthesis: batchAiSynthesis,
            results: batchResults
        });
    } catch (error) {
        if (LoggerService.logError) LoggerService.logError(error, { endpoint: '/batch', body: req.body });
        next(error);
    }
});

// ============================================================
// AI CHAT ASSISTANT ROUTE (Priority 4)
// ============================================================
router.post('/chat', async (req, res, next) => {
    try {
        const { messages, context } = req.body;
        if (!Array.isArray(messages) || !messages.length) {
            return res.status(400).json({ success: false, error: 'Messages array required for AI Chat' });
        }
        const chatResponse = await GroqService.chat(messages, context || {});
        return res.json(chatResponse);
    } catch (error) {
        next(error);
    }
});

module.exports = router;