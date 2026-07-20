const express = require('express');
const router = express.Router();

const VirusTotalService = require('../services/virustotal.service');
const AbuseIPDBService = require('../services/abuseipdb.service');
const ShodanService = require('../services/shodan.service');
const OTXService = require('../services/otx.service');
const GroqService = require('../services/groq.service');
const CacheService = require('../services/cache.service');
const LoggerService = require('../services/logger.service');

const { validateIP, validateDomain, validateHash, validateURL } = require('../middleware/validator');
const { calculateRisk } = require('../utils/risk-calculator');

// ============================================================
// INVESTIGATE IP
// ============================================================
router.get('/ip/:ip', validateIP, async (req, res, next) => {
    try {
        const ip = req.params.ip;
        const cacheKey = CacheService.generateKey({ type: 'ip', value: ip });

        // Check cache
        const cached = CacheService.get(cacheKey);
        if (cached) {
            return res.json({
                success: true,
                cached: true,
                data: cached
            });
        }

        // Query all services in parallel
        const [vt, abuse, shodan, otx] = await Promise.all([
            VirusTotalService.investigateIP(ip),
            AbuseIPDBService.investigateIP(ip),
            ShodanService.investigateIP(ip),
            OTXService.investigateIP(ip)
        ]);

        // Build results object
        const results = { vt, abuse, shodan, otx };

        // Calculate risk score
        const risk = calculateRisk(results, { type: 'ip', value: ip });

        // Generate AI summary
        const aiSummary = await GroqService.generateSummary(
            { type: 'ip', value: ip },
            results,
            risk.score
        );

        // Build response
        const response = {
            ioc: { type: 'ip', value: ip },
            risk,
            ai_summary: aiSummary,
            enrichment: {
                geolocation: vt.success ? {
                    country: vt.country,
                    as_owner: vt.as_owner,
                    isp: abuse.success ? abuse.isp : null
                } : null,
                asn: shodan.success ? {
                    number: shodan.asn,
                    organisation: shodan.organisation
                } : null
            },
            providers: {
                virustotal: vt,
                abuseipdb: abuse,
                shodan: shodan,
                otx: otx,
                groq: aiSummary
            },
            timestamp: new Date().toISOString(),
            investigation_id: `inv_${Date.now()}`
        };

        // Cache response
        CacheService.set(cacheKey, response);

        // Log investigation
        LoggerService.logInvestigation({
            ioc: ip,
            type: 'ip',
            risk_score: risk.score,
            verdict: risk.verdict,
            sources: Object.keys(results).filter(k => results[k]?.success).length,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            cached: false,
            data: response
        });

    } catch (error) {
        LoggerService.logError(error, { endpoint: '/ip/:ip', params: req.params });
        next(error);
    }
});

// ============================================================
// INVESTIGATE DOMAIN
// ============================================================
router.get('/domain/:domain', validateDomain, async (req, res, next) => {
    try {
        const domain = req.params.domain;
        const cacheKey = CacheService.generateKey({ type: 'domain', value: domain });

        // Check cache
        const cached = CacheService.get(cacheKey);
        if (cached) {
            return res.json({
                success: true,
                cached: true,
                data: cached
            });
        }

        const [vt, otx] = await Promise.all([
            VirusTotalService.investigateDomain(domain),
            OTXService.investigateDomain(domain)
        ]);

        const results = { vt, otx };
        const risk = calculateRisk(results, { type: 'domain', value: domain });

        const aiSummary = await GroqService.generateSummary(
            { type: 'domain', value: domain },
            results,
            risk.score
        );

        const response = {
            ioc: { type: 'domain', value: domain },
            risk,
            ai_summary: aiSummary,
            providers: {
                virustotal: vt,
                otx: otx,
                groq: aiSummary
            },
            timestamp: new Date().toISOString(),
            investigation_id: `inv_${Date.now()}`
        };

        CacheService.set(cacheKey, response);

        LoggerService.logInvestigation({
            ioc: domain,
            type: 'domain',
            risk_score: risk.score,
            verdict: risk.verdict,
            sources: Object.keys(results).filter(k => results[k]?.success).length,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            cached: false,
            data: response
        });

    } catch (error) {
        LoggerService.logError(error, { endpoint: '/domain/:domain', params: req.params });
        next(error);
    }
});

// ============================================================
// INVESTIGATE HASH
// ============================================================
router.get('/hash/:hash', validateHash, async (req, res, next) => {
    try {
        const hash = req.params.hash;
        const cacheKey = CacheService.generateKey({ type: 'hash', value: hash });

        // Check cache
        const cached = CacheService.get(cacheKey);
        if (cached) {
            return res.json({
                success: true,
                cached: true,
                data: cached
            });
        }

        const [vt, otx] = await Promise.all([
            VirusTotalService.investigateHash(hash),
            OTXService.investigateHash(hash)
        ]);

        const results = { vt, otx };
        const risk = calculateRisk(results, { type: 'hash', value: hash });

        const aiSummary = await GroqService.generateSummary(
            { type: 'hash', value: hash },
            results,
            risk.score
        );

        const response = {
            ioc: { type: 'hash', value: hash },
            risk,
            ai_summary: aiSummary,
            providers: {
                virustotal: vt,
                otx: otx,
                groq: aiSummary
            },
            timestamp: new Date().toISOString(),
            investigation_id: `inv_${Date.now()}`
        };

        CacheService.set(cacheKey, response);

        LoggerService.logInvestigation({
            ioc: hash,
            type: 'hash',
            risk_score: risk.score,
            verdict: risk.verdict,
            sources: Object.keys(results).filter(k => results[k]?.success).length,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            cached: false,
            data: response
        });

    } catch (error) {
        LoggerService.logError(error, { endpoint: '/hash/:hash', params: req.params });
        next(error);
    }
});

module.exports = router;