// src/services/urlscan.service.js
const axios = require('axios');
const { isKeyConfigured } = require('../middleware/auth');

class URLScanService {
    constructor() {
        this.apiKey = process.env.URLSCAN_API_KEY;
        this.baseUrl = 'https://urlscan.io/api/v1';
    }

    async scan(url) {
        try {
            // Validate API key
            if (!isKeyConfigured('URLSCAN_API_KEY')) {
                console.warn('⚠️ URLScan API key not configured');
                return {
                    success: false,
                    error: 'URLScan API key not configured',
                    provider: 'urlscan',
                    fallback: true
                };
            }

            // Submit URL for scanning
            const submitResponse = await axios.post(
                `${this.baseUrl}/scan`,
                {
                    url: url,
                    visibility: 'public'
                },
                {
                    headers: {
                        'API-Key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            const uuid = submitResponse.data.uuid;
            if (!uuid) {
                return {
                    success: false,
                    error: 'No UUID returned from URLScan',
                    provider: 'urlscan'
                };
            }

            // Poll for results (max ~7 seconds)
            let result = null;
            let attempts = 0;
            while (attempts < 5) {
                await new Promise(resolve => setTimeout(resolve, 1200));
                try {
                    const resultResponse = await axios.get(`${this.baseUrl}/result/${uuid}`, {
                        headers: { 'API-Key': this.apiKey },
                        timeout: 4000
                    });
                    if (resultResponse.data && resultResponse.data.task) {
                        result = resultResponse.data;
                        break;
                    }
                } catch (e) {
                    // Still processing
                }
                attempts++;
            }

            if (!result) {
                return {
                    success: false,
                    error: 'Scan timed out after 30 seconds',
                    provider: 'urlscan',
                    uuid: uuid
                };
            }

            // Parse successful result
            return {
                success: true,
                uuid: uuid,
                url: result.task?.url || url,
                status: result.task?.state || 'complete',
                screenshot: result.screenshot ? `https://urlscan.io/screenshots/${uuid}.png` : null,
                page: {
                    title: result.page?.title || '',
                    domain: result.page?.domain || '',
                    server: result.page?.server || '',
                    ip: result.page?.ip || '',
                    country: result.page?.country || ''
                },
                lists: {
                    urls: result.lists?.urls || [],
                    domains: result.lists?.domains || [],
                    ips: result.lists?.ips || []
                },
                verdicts: result.verdicts || {},
                redirects: result.redirects || [],
                provider: 'urlscan'
            };

        } catch (error) {
            console.error('URLScan Error:', error.response?.data || error.message);
            
            // If error is 404, it's likely a bad API key or endpoint
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'URLScan API endpoint not found. Check your API key and endpoint.',
                    provider: 'urlscan',
                    status: 404
                };
            }

            // If error is 401/403, it's an auth issue
            if (error.response?.status === 401 || error.response?.status === 403) {
                return {
                    success: false,
                    error: 'URLScan API authentication failed. Please check your API key.',
                    provider: 'urlscan',
                    status: error.response.status
                };
            }

            return {
                success: false,
                error: error.message,
                provider: 'urlscan'
            };
        }
    }

    // Alternative: Search for existing scans (doesn't require API key)
    async search(url) {
        try {
            const response = await axios.get(`${this.baseUrl}/search`, {
                params: { q: `domain:${new URL(url).hostname}` },
                timeout: 5000
            });
            return {
                success: true,
                results: response.data.results || [],
                total: response.data.total || 0,
                provider: 'urlscan-search'
            };
        } catch (error) {
            console.error('URLScan Search Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'urlscan-search'
            };
        }
    }
}

module.exports = new URLScanService();