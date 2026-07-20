// src/services/asn.service.js
const axios = require('axios');

class ASNService {
    async getASN(ip) {
        try {
            // Using ip-api.com to get ASN info (free, no key)
            const response = await axios.get(`http://ip-api.com/json/${ip}?fields=as,org,isp,country`);
            
            const data = response.data;
            if (!data.as) {
                return { success: false, error: 'No ASN data found', provider: 'asn' };
            }

            // Parse ASN (format: "AS15169 Google LLC")
            const asParts = data.as.split(' ');
            const asNumber = asParts[0]?.replace('AS', '') || 'Unknown';

            return {
                success: true,
                asn: asNumber,
                as_name: data.org || data.isp || 'Unknown',
                country: data.country || 'Unknown',
                provider: 'asn'
            };
        } catch (error) {
            console.error('ASN Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'asn'
            };
        }
    }
}

module.exports = new ASNService();