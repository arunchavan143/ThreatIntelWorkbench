// ============================================================
// src/middleware/validator.js
// ============================================================

const { HASH_TYPES } = require('../config/constants');

function validateIP(req, res, next) {
    const ip = req.params.ip;
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

    if (!ipRegex.test(ip) && !ipv6Regex.test(ip)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid IP address format'
        });
    }

    next();
}

function validateDomain(req, res, next) {
    const domain = req.params.domain;
    const domainRegex = /^(?:(?:(?:[a-zA-Z0-9][-a-zA-Z0-9]{0,62})?[a-zA-Z0-9]\.)+[a-zA-Z]{2,63})$/;

    if (!domainRegex.test(domain)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid domain format'
        });
    }

    next();
}

function validateHash(req, res, next) {
    const hash = req.params.hash.toLowerCase();

    const hashTypes = {
        MD5: { length: 32, regex: /^[a-fA-F0-9]{32}$/ },
        SHA1: { length: 40, regex: /^[a-fA-F0-9]{40}$/ },
        SHA256: { length: 64, regex: /^[a-fA-F0-9]{64}$/ }
    };

    const isValid = Object.values(hashTypes).some(type => {
        return type.regex.test(hash);
    });

    if (!isValid) {
        return res.status(400).json({
            success: false,
            error: 'Invalid hash format. Must be MD5, SHA1, or SHA256'
        });
    }

    next();
}

function validateURL(req, res, next) {
    const url = req.params.url;
    try {
        const urlObj = new URL(url);
        if (!urlObj.protocol.startsWith('http')) {
            throw new Error('Invalid protocol');
        }
        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: 'Invalid URL format'
        });
    }
}

module.exports = {
    validateIP,
    validateDomain,
    validateHash,
    validateURL
};