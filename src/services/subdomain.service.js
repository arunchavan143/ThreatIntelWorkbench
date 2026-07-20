// src/services/subdomain.service.js
const dns = require('dns').promises;

class SubdomainService {
    // Common subdomain wordlist (can be expanded)
    commonSubdomains = [
        'www', 'mail', 'ftp', 'admin', 'api', 'test', 'dev', 'staging', 
        'secure', 'beta', 'vpn', 'webmail', 'cpanel', 'whm', 'ns1', 'ns2',
        'blog', 'shop', 'store', 'support', 'help', 'docs', 'static', 'media',
        'cdn', 'images', 'video', 'music', 'download', 'upload', 'backup'
    ];

    async discover(domain) {
        try {
            const found = [];
            const promises = this.commonSubdomains.map(async (sub) => {
                const full = `${sub}.${domain}`;
                try {
                    await dns.resolve4(full);
                    found.push(full);
                } catch (e) {
                    // No A record, skip
                }
            });
            await Promise.all(promises);

            return {
                success: true,
                subdomains: found,
                count: found.length,
                provider: 'subdomain'
            };
        } catch (error) {
            console.error('Subdomain Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'subdomain'
            };
        }
    }
}

module.exports = new SubdomainService();