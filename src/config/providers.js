// ============================================================
// src/config/providers.js - Provider Metadata & Configs
// ============================================================

module.exports = {
    virustotal: {
        name: 'VirusTotal',
        description: 'Multi-engine anti-malware and domain reputation scanner',
        rateLimitPerMin: 4,
        timeoutMs: 8000,
        enabled: true
    },
    abuseipdb: {
        name: 'AbuseIPDB',
        description: 'Crowdsourced IP address abuse reporting and confidence metrics',
        rateLimitPerMin: 30,
        timeoutMs: 6000,
        enabled: true
    },
    shodan: {
        name: 'Shodan',
        description: 'Search engine for internet-connected devices, open ports, and vulnerabilities',
        rateLimitPerMin: 60,
        timeoutMs: 8000,
        enabled: true
    },
    otx: {
        name: 'AlienVault OTX',
        description: 'Open Threat Exchange collaborative pulse and IOC database',
        rateLimitPerMin: 60,
        timeoutMs: 8000,
        enabled: true
    },
    urlscan: {
        name: 'URLScan.io',
        description: 'Sandbox scanner for web sites and URL indicator analysis',
        rateLimitPerMin: 30,
        timeoutMs: 10000,
        enabled: true
    },
    groq: {
        name: 'Groq AI',
        description: 'High-speed LLM inference engine for AI synthesized threat assessments',
        rateLimitPerMin: 30,
        timeoutMs: 12000,
        enabled: true
    }
};
