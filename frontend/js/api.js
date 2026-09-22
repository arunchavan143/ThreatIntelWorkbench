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

// ============================================================
// AI MODEL STATE MANAGEMENT
// Loads supported models from backend, validates and restores
// the user's last selection from localStorage.
// ============================================================

const AI_MODEL_STORAGE_KEY = 'threatIntel.aiModel';

async function initAIModelState() {
    try {
        const data = await fetch('/api/ai/models').then(r => r.json());
        if (!data.success || !data.models || !data.models.length) {
            console.warn('AI models endpoint returned no models — using default');
            return;
        }

        // Store full model list globally
        window.aiModels = data.models;

        // Restore saved selection and validate against current allowlist
        const saved = localStorage.getItem(AI_MODEL_STORAGE_KEY);
        const validSaved = saved && data.models.find(m => m.id === saved);
        const chosen = validSaved ? validSaved : data.models.find(m => m.id === data.default_model) || data.models[0];

        window.aiSelectedModel = chosen.id;
        window.aiSelectedModelName = chosen.name;

        // Persist validated choice
        localStorage.setItem(AI_MODEL_STORAGE_KEY, chosen.id);

    } catch (err) {
        // Non-fatal — app continues, AI features may be limited
        console.warn('Could not load AI model list:', err.message);
        window.aiSelectedModel = null;
        window.aiSelectedModelName = null;
        window.aiModels = [];
    }
}

// Initialize AI model state on page load
document.addEventListener('DOMContentLoaded', () => {
    initAIModelState();
});