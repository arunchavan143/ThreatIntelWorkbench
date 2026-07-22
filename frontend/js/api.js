// ============================================================
// API CALLS
// ============================================================

const API_BASE = '/api';

async function apiRequest(endpoint, options = {}) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || `HTTP ${res.status}`);
        }
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function investigateIP(ip) {
    return apiRequest(`/investigate/ip/${encodeURIComponent(ip)}`);
}

function investigateDomain(domain) {
    return apiRequest(`/investigate/domain/${encodeURIComponent(domain)}`);
}

function investigateHash(hash) {
    return apiRequest(`/investigate/hash/${encodeURIComponent(hash)}`);
}

function investigateURL(url) {
    return apiRequest(`/investigate/url?url=${encodeURIComponent(url)}`);
}

function investigateBatch(indicators) {
    return apiRequest('/investigate/batch', {
        method: 'POST',
        body: JSON.stringify({ indicators })
    });
}

function getHistory(limit = 50) {
    return apiRequest(`/history?limit=${limit}`);
}

function getHealth() {
    return fetch('/health').then(r => r.json());
}