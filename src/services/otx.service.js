const axios = require('axios');

class OTXService {
    constructor() {
        this.apiKey = process.env.OTX_API_KEY;
        this.baseUrl = 'https://otx.alienvault.com/api/v1';
    }

    async investigateIP(ip) {
        try {
            const response = await axios.get(`${this.baseUrl}/indicators/IPv4/${ip}/general`, {
                headers: { 'X-OTX-API-KEY': this.apiKey }
            });

            const data = response.data;

            return {
                success: true,
                pulses: data.pulse_info?.count || 0,
                tags: data.pulse_info?.tags || [],
                activity: data.pulse_info?.participants || 0,
                related_indicators: data.pulse_info?.related || [],
                provider: 'otx'
            };
        } catch (error) {
            console.error('OTX Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'otx'
            };
        }
    }

    async investigateDomain(domain) {
        try {
            const response = await axios.get(`${this.baseUrl}/indicators/domain/${domain}/general`, {
                headers: { 'X-OTX-API-KEY': this.apiKey }
            });

            const data = response.data;

            return {
                success: true,
                pulses: data.pulse_info?.count || 0,
                tags: data.pulse_info?.tags || [],
                provider: 'otx'
            };
        } catch (error) {
            console.error('OTX Domain Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'otx'
            };
        }
    }

    async investigateHash(hash) {
        try {
            const response = await axios.get(`${this.baseUrl}/indicators/file/${hash}/general`, {
                headers: { 'X-OTX-API-KEY': this.apiKey }
            });

            const data = response.data;

            return {
                success: true,
                pulses: data.pulse_info?.count || 0,
                tags: data.pulse_info?.tags || [],
                file_type: data.file_class || 'unknown',
                provider: 'otx'
            };
        } catch (error) {
            console.error('OTX Hash Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'otx'
            };
        }
    }
}

module.exports = new OTXService();