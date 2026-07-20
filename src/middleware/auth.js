// ============================================================
// src/middleware/auth.js
// ============================================================

// Simple pass-through middleware for local use
function validateApiKey(req, res, next) {
    next();
}

function validateExternalAPI(req, res, next) {
    // Check if API keys are configured (warn only)
    const requiredKeys = [
        'VIRUSTOTAL_API_KEY',
        'ABUSEIPDB_API_KEY',
        'SHODAN_API_KEY',
        'OTX_API_KEY',
        'URLSCAN_API_KEY',
        'GROQ_API_KEY'
    ];

    const missingKeys = [];
    for (const key of requiredKeys) {
        if (!process.env[key] || process.env[key] === 'your_' + key.toLowerCase() + '_here') {
            missingKeys.push(key);
        }
    }

    if (missingKeys.length > 0) {
        console.warn('⚠️ Missing API keys:', missingKeys.join(', '));
    }

    next();
}

module.exports = {
    validateApiKey,
    validateExternalAPI
};