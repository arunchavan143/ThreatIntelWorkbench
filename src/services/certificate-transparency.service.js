// src/services/certificate-transparency.service.js
const axios = require('axios');

class CertificateTransparencyService {
    async getCertificates(domain) {
        try {
            const response = await axios.get(`https://crt.sh/?q=${domain}&output=json`);
            const data = response.data;
            // Parse and return
            return {
                success: true,
                certificates: data.slice(0, 10).map(cert => ({
                    issuer: cert.issuer_name,
                    common_name: cert.name_value,
                    valid_from: cert.not_before,
                    valid_to: cert.not_after,
                    serial: cert.serial_number
                })),
                provider: 'ct'
            };
        } catch (error) {
            console.error('CT Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'ct'
            };
        }
    }
}

module.exports = new CertificateTransparencyService();