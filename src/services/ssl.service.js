// src/services/ssl.service.js
const tls = require('tls');

class SSLService {
    async getCertificate(domain) {
        try {
            const cert = await new Promise((resolve, reject) => {
                const socket = tls.connect({
                    host: domain,
                    port: 443,
                    rejectUnauthorized: false
                }, () => {
                    const cert = socket.getPeerCertificate();
                    socket.end();
                    resolve(cert);
                });
                socket.on('error', reject);
                socket.setTimeout(5000, () => {
                    socket.destroy();
                    reject(new Error('SSL connection timeout'));
                });
            });

            return {
                success: true,
                subject: cert.subject,
                issuer: cert.issuer,
                valid_from: cert.valid_from,
                valid_to: cert.valid_to,
                serialNumber: cert.serialNumber,
                fingerprint: cert.fingerprint,
                san: cert.subjectaltname ? cert.subjectaltname.split(', ') : [],
                provider: 'ssl'
            };
        } catch (error) {
            console.error('SSL Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'ssl'
            };
        }
    }
}

module.exports = new SSLService();