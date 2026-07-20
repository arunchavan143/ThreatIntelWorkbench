// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function detectType(value) {
    if (!value) return null;
    const v = value.trim();
    // IP (IPv4)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(v)) return 'ip';
    // Domain
    if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(v)) return 'domain';
    // Hash: MD5 (32), SHA1 (40), SHA256 (64)
    if (/^[a-fA-F0-9]{32}$/.test(v) || /^[a-fA-F0-9]{40}$/.test(v) || /^[a-fA-F0-9]{64}$/.test(v)) return 'hash';
    // URL
    if (/^https?:\/\//i.test(v)) return 'url';
    return 'unknown';
}

function formatDate(isoString) {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    return d.toLocaleString('en-US', { 
        month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit',
        hour12: true 
    });
}

function getVerdictColor(score) {
    if (score >= 80) return { color: '#ef4444', label: 'CRITICAL', emoji: '🔴' };
    if (score >= 60) return { color: '#f59e0b', label: 'HIGH', emoji: '🟠' };
    if (score >= 30) return { color: '#3b82f6', label: 'MEDIUM', emoji: '🔵' };
    return { color: '#22c55e', label: 'LOW', emoji: '🟢' };
}

function getVerdictClass(verdict) {
    const map = {
        'LOW': 'verdict-low',
        'MEDIUM': 'verdict-medium',
        'HIGH': 'verdict-high',
        'CRITICAL': 'verdict-critical'
    };
    return map[verdict] || 'verdict-low';
}

function truncate(str, len = 20) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '...' : str;
}

function getProviderStatus(provider) {
    if (!provider) return { status: 'offline', icon: 'fa-circle-xmark', class: 'status-error' };
    if (provider.success === false) return { status: 'Error', icon: 'fa-circle-xmark', class: 'status-error' };
    return { status: 'Online', icon: 'fa-circle-check', class: 'status-online' };
}

function getTypeBadgeClass(type) {
    const map = {
        'ip': 'ip',
        'domain': 'domain',
        'hash': 'hash',
        'url': 'url'
    };
    return map[type] || 'ip';
}

function safeString(val) {
    if (val === null || val === undefined) return 'N/A';
    return String(val);
}