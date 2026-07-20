// src/services/dns.service.js
const dns = require('dns').promises;

class DNSService {
    async lookup(domain) {
        try {
            const [a, mx, txt, ns, cname] = await Promise.all([
                dns.resolve4(domain).catch(() => []),
                dns.resolveMx(domain).catch(() => []),
                dns.resolveTxt(domain).catch(() => []),
                dns.resolveNs(domain).catch(() => []),
                dns.resolveCname(domain).catch(() => [])
            ]);

            return {
                success: true,
                a: a,
                mx: mx,
                txt: txt.map(arr => arr.join('')),
                ns: ns,
                cname: cname,
                provider: 'dns'
            };
        } catch (error) {
            console.error('DNS Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'dns'
            };
        }
    }
}

module.exports = new DNSService();