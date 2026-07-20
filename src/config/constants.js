module.exports = {
    // API Endpoints
    API_ENDPOINTS: {
        VIRUSTOTAL: {
            IP: 'https://www.virustotal.com/api/v3/ip_addresses',
            DOMAIN: 'https://www.virustotal.com/api/v3/domains',
            URL: 'https://www.virustotal.com/api/v3/urls',
            FILE: 'https://www.virustotal.com/api/v3/files'
        },
        ABUSEIPDB: {
            CHECK: 'https://api.abuseipdb.com/api/v2/check'
        },
        SHODAN: {
            HOST: 'https://api.shodan.io/shodan/host'
        },
        OTX: {
            PULSES: 'https://otx.alienvault.com/api/v1/indicators'
        },
        URLSCAN: {
            SEARCH: 'https://urlscan.io/api/v1/search',
            RESULT: 'https://urlscan.io/api/v1/result'
        },
        GROQ: {
            CHAT: 'https://api.groq.com/openai/v1/chat/completions'
        }
    },

    // Risk thresholds
    RISK_THRESHOLDS: {
        CRITICAL: 80,
        HIGH: 60,
        MEDIUM: 30,
        LOW: 0
    },

    // Provider weights for risk calculation
    PROVIDER_WEIGHTS: {
        VIRUSTOTAL: 0.25,
        ABUSEIPDB: 0.20,
        SHODAN: 0.15,
        OTX: 0.20,
        URLSCAN: 0.10,
        GROQ: 0.10
    },

    // Cache TTL (seconds)
    CACHE_TTL: parseInt(process.env.CACHE_TTL_SECONDS) || 1800,

    // Batch limits
    MAX_BATCH_SIZE: parseInt(process.env.MAX_BATCH_SIZE) || 10,

    // IOC types
    IOC_TYPES: {
        IP: 'ip',
        DOMAIN: 'domain',
        HASH: 'hash',
        URL: 'url',
        EMAIL: 'email'
    },

    // Hash types supported
    HASH_TYPES: {
        MD5: { length: 32, regex: /^[a-fA-F0-9]{32}$/ },
        SHA1: { length: 40, regex: /^[a-fA-F0-9]{40}$/ },
        SHA256: { length: 64, regex: /^[a-fA-F0-9]{64}$/ }
    }
};