// ============================================================
// src/utils/validators.js - Programmatic String Validators
// ============================================================

const { HASH_TYPES } = require('../config/constants');

function isValidIP(ip) {
    if (!ip || typeof ip !== 'string') return false;
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    return ipv4Regex.test(ip.trim()) || ipv6Regex.test(ip.trim());
}

function isValidDomain(domain) {
    if (!domain || typeof domain !== 'string') return false;
    const domainRegex = /^(?:(?:(?:[a-zA-Z0-9][-a-zA-Z0-9]{0,62})?[a-zA-Z0-9]\.)+[a-zA-Z]{2,63})$/;
    return domainRegex.test(domain.trim());
}

function isValidHash(hash) {
    if (!hash || typeof hash !== 'string') return false;
    const lower = hash.trim().toLowerCase();
    return Object.values(HASH_TYPES).some(type => type.regex.test(lower));
}

function isValidURL(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return false;
    try {
        const urlObj = new URL(urlStr.trim());
        return urlObj.protocol.startsWith('http');
    } catch {
        return false;
    }
}

module.exports = {
    isValidIP,
    isValidDomain,
    isValidHash,
    isValidURL
};
