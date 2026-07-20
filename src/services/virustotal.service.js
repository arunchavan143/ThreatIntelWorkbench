const axios = require('axios');
const { API_ENDPOINTS } = require('../config/constants');

class VirusTotalService {
    constructor() {
        this.apiKey = process.env.VIRUSTOTAL_API_KEY;
        this.baseUrl = 'https://www.virustotal.com/api/v3';
        this.headers = {
            'x-apikey': this.apiKey,
            'Content-Type': 'application/json'
        };
    }

    async investigateIP(ip) {
        try {
            const response = await axios.get(`${API_ENDPOINTS.VIRUSTOTAL.IP}/${ip}`, {
                headers: this.headers
            });

            const data = response.data.data;
            const stats = data.attributes.last_analysis_stats;

            return {
                success: true,
                detections: stats.malicious || 0,
                total: stats.malicious + stats.suspicious + stats.undetected,
                ratio: `${stats.malicious || 0}/${stats.malicious + stats.suspicious + stats.undetected}`,
                scan_date: data.attributes.last_analysis_date,
                first_seen: data.attributes.first_seen_date,
                country: data.attributes.country,
                as_owner: data.attributes.as_owner,
                categories: data.attributes.categories || [],
                vendors_detected: this.getDetectedVendors(data.attributes.last_analysis_results),
                harmless: stats.harmless || 0,
                suspicious: stats.suspicious || 0,
                undetected: stats.undetected || 0,
                reputation: data.attributes.reputation || 0,
                provider: 'virustotal'
            };
        } catch (error) {
            console.error('VirusTotal IP Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'virustotal'
            };
        }
    }

    async investigateDomain(domain) {
        try {
            const response = await axios.get(`${API_ENDPOINTS.VIRUSTOTAL.DOMAIN}/${domain}`, {
                headers: this.headers
            });

            const data = response.data.data;
            const stats = data.attributes.last_analysis_stats;

            return {
                success: true,
                detections: stats.malicious || 0,
                total: stats.malicious + stats.suspicious + stats.undetected,
                ratio: `${stats.malicious || 0}/${stats.malicious + stats.suspicious + stats.undetected}`,
                scan_date: data.attributes.last_analysis_date,
                categories: data.attributes.categories || [],
                reputation: data.attributes.reputation || 0,
                provider: 'virustotal'
            };
        } catch (error) {
            console.error('VirusTotal Domain Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'virustotal'
            };
        }
    }

    async investigateHash(hash) {
        try {
            const response = await axios.get(`${API_ENDPOINTS.VIRUSTOTAL.FILE}/${hash}`, {
                headers: this.headers
            });

            const data = response.data.data;
            const stats = data.attributes.last_analysis_stats;

            return {
                success: true,
                detections: stats.malicious || 0,
                total: stats.malicious + stats.suspicious + stats.undetected,
                ratio: `${stats.malicious || 0}/${stats.malicious + stats.suspicious + stats.undetected}`,
                scan_date: data.attributes.last_analysis_date,
                first_submission: data.attributes.first_submission_date,
                last_submission: data.attributes.last_submission_date,
                file_size: data.attributes.size,
                file_type: data.attributes.type_tag,
                magic: data.attributes.magic,
                names: data.attributes.names || [],
                vendors_detected: this.getDetectedVendors(data.attributes.last_analysis_results),
                provider: 'virustotal'
            };
        } catch (error) {
            console.error('VirusTotal Hash Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'virustotal'
            };
        }
    }

    getDetectedVendors(results) {
        const detected = [];
        if (results) {
            for (const [vendor, result] of Object.entries(results)) {
                if (result.category === 'malicious' || result.category === 'suspicious') {
                    detected.push({ vendor, category: result.category });
                }
            }
        }
        return detected;
    }
}

module.exports = new VirusTotalService();