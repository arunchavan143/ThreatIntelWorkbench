const axios = require('axios');

class AbuseIPDBService {
    constructor() {
        this.apiKey = process.env.ABUSEIPDB_API_KEY;
        this.baseUrl = 'https://api.abuseipdb.com/api/v2';
    }

    async investigateIP(ip) {
        try {
            const response = await axios.get(`${this.baseUrl}/check`, {
                params: {
                    ipAddress: ip,
                    maxAgeInDays: 90,
                    verbose: true
                },
                headers: {
                    'Key': this.apiKey,
                    'Accept': 'application/json'
                }
            });

            const data = response.data.data;

            return {
                success: true,
                abuse_score: data.abuseConfidenceScore || 0,
                country: data.countryCode,
                country_name: data.countryName,
                isp: data.isp,
                domain: data.domain,
                usage_type: data.usageType,
                total_reports: data.totalReports || 0,
                last_reported: data.lastReportedAt,
                reports: data.reports ? data.reports.slice(0, 5).map(r => ({
                    category: r.categories.join(', '),
                    count: 1,
                    timestamp: r.reportedAt
                })) : [],
                confidence: 100 - (data.abuseConfidenceScore || 0),
                provider: 'abuseipdb'
            };
        } catch (error) {
            console.error('AbuseIPDB Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'abuseipdb'
            };
        }
    }
}

module.exports = new AbuseIPDBService();