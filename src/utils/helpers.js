// ============================================================
// src/utils/helpers.js - General Backend Utilities
// ============================================================

const { HASH_TYPES } = require('../config/constants');

function detectIOCType(value) {
    if (!value || typeof value !== 'string') return 'unknown';
    const trimmed = value.trim();

    // Check IP (IPv4 or IPv6)
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Regex.test(trimmed)) return 'ip';
    if (trimmed.includes(':') && /^[0-9a-fA-F:]+$/.test(trimmed) && trimmed.length > 2) return 'ip';

    // Check URL
    if (/^https?:\/\//i.test(trimmed)) return 'url';

    // Check Hash
    const lower = trimmed.toLowerCase();
    if (HASH_TYPES.MD5.regex.test(lower) || HASH_TYPES.SHA1.regex.test(lower) || HASH_TYPES.SHA256.regex.test(lower)) {
        return 'hash';
    }

    // Check Domain
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
    if (domainRegex.test(trimmed)) return 'domain';

    return 'unknown';
}

function safeString(str, fallback = 'N/A') {
    if (str === null || str === undefined || str === '') return fallback;
    return String(str).trim();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[<>'"&]/g, '');
}

module.exports = {
    detectIOCType,
    safeString,
    delay,
    sanitizeInput
};
