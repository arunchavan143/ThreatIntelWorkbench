const axios = require('axios');
const { withApiWrapper } = require('../utils/api-wrapper');

class ShodanService {
    constructor() {
        this.apiKey = process.env.SHODAN_API_KEY;
        this.baseUrl = 'https://api.shodan.io';
    }

    async investigateIP(ip) {
        return withApiWrapper('shodan', 'ip', ip, async () => {
            try {
                const response = await axios.get(`${this.baseUrl}/shodan/host/${ip}`, {
                    params: { key: this.apiKey }
                });

                const data = response.data;

                return {
                    success: true,
                    ports: data.ports || [],
                    services: data.data ? data.data.map(s => ({
                        port: s.port,
                        service: s.service || 'unknown',
                        product: s.product || 'unknown',
                        version: s.version || 'unknown'
                    })) : [],
                    vulnerabilities: data.vulns ? Object.keys(data.vulns) : [],
                    hostnames: data.hostnames || [],
                    asn: data.asn,
                    isp: data.isp,
                    country: data.country_code,
                    os: data.os,
                    organisation: data.org,
                    provider: 'shodan'
                };
            } catch (error) {
                console.error('Shodan Error:', error.message);
                return {
                    success: false,
                    error: error.message,
                    provider: 'shodan'
                };
            }
        });
    }
}

module.exports = new ShodanService();