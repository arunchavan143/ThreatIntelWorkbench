// ============================================================
// src/middleware/auth.js
// ============================================================

function isKeyConfigured(keyName) {
    const val = process.env[keyName];
    if (!val || typeof val !== 'string') return false;
    const trimmed = val.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('your_') || lower.includes('_here') || lower === 'placeholder' || lower === 'null' || lower === 'undefined') {
        return false;
    }
    return true;
}

function validateApiKey(req, res, next) {
    const configuredKey = process.env.WORKBENCH_API_KEY || process.env.API_KEY;
    
    // If no secret key is configured on the server, allow open development access
    if (!configuredKey) {
        return next();
    }

    const apiKeyHeader = req.headers['x-api-key'];
    const authHeader = req.headers['authorization'];
    let providedKey = null;

    if (apiKeyHeader) {
        providedKey = apiKeyHeader;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
        providedKey = authHeader.substring(7).trim();
    }

    if (!providedKey || providedKey !== configuredKey) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid or missing API key'
        });
    }

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
        if (!isKeyConfigured(key)) {
            missingKeys.push(key);
        }
    }

    if (missingKeys.length > 0) {
        console.warn('⚠️ Missing or placeholder API keys:', missingKeys.join(', '));
    }

    next();
}

module.exports = {
    validateApiKey,
    validateExternalAPI,
    isKeyConfigured
};