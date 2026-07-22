// src/services/whois.service.js

class WhoisService {
    async lookup(domain) {
        try {
            // Lazy load / dynamic import to support ESM compatibility across CommonJS and Jest environments
            let whoisModule;
            try {
                whoisModule = require('whois');
            } catch (err) {
                if (err.code === 'ERR_REQUIRE_ESM' || err instanceof SyntaxError) {
                    const esm = await import('whois');
                    whoisModule = esm.default || esm;
                } else {
                    throw err;
                }
            }
            const whois = whoisModule;

            const lookupPromise = new Promise((resolve, reject) => {
                whois.lookup(domain, { timeout: 6000 }, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('WHOIS lookup timed out after 6000ms')), 6000);
            });
            const result = await Promise.race([lookupPromise, timeoutPromise]);

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
        if (!raw || typeof raw !== 'string') return {};
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