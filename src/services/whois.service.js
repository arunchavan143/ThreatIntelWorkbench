// src/services/whois.service.js
const whois = require('whois');

class WhoisService {
    async lookup(domain) {
        try {
            const result = await new Promise((resolve, reject) => {
                whois.lookup(domain, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });

            // Parse whois data (simplified)
            const parsed = this.parseWhois(result);
            return {
                success: true,
                ...parsed,
                provider: 'whois'
            };
        } catch (error) {
            console.error('WHOIS Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'whois'
            };
        }
    }

    parseWhois(raw) {
        const lines = raw.split('\n');
        const data = {};
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, ...val] = line.split(':');
                const k = key.trim().toLowerCase();
                const v = val.join(':').trim();
                if (k === 'registrar') data.registrar = v;
                else if (k === 'creation date') data.creation_date = v;
                else if (k === 'expiration date') data.expiration_date = v;
                else if (k === 'name server') {
                    if (!data.nameservers) data.nameservers = [];
                    data.nameservers.push(v);
                }
                else if (k === 'registrant') data.registrant = v;
            }
        }
        return data;
    }
}

module.exports = new WhoisService();