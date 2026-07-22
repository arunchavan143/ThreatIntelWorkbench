const request = require('supertest');
const app = require('../src/app');

// Mock external services to prevent live network calls and ESM module loading errors during tests
jest.mock('../src/services/virustotal.service', () => ({
    investigateIP: jest.fn().mockResolvedValue({ success: true, detections: 5, ratio: '5/72', country: 'US', as_owner: 'Google LLC' }),
    investigateDomain: jest.fn().mockResolvedValue({ success: true, detections: 2, ratio: '2/72' }),
    investigateHash: jest.fn().mockResolvedValue({ success: true, detections: 65, ratio: '65/72' })
}));
jest.mock('../src/services/abuseipdb.service', () => ({
    investigateIP: jest.fn().mockResolvedValue({ success: true, abuse_score: 25, isp: 'Google LLC' })
}));
jest.mock('../src/services/shodan.service', () => ({
    investigateIP: jest.fn().mockResolvedValue({ success: true, asn: 'AS15169', organisation: 'Google LLC', vulnerabilities: ['CVE-2021-44228'] })
}));
jest.mock('../src/services/otx.service', () => ({
    investigateIP: jest.fn().mockResolvedValue({ success: true, pulses: 3 }),
    investigateDomain: jest.fn().mockResolvedValue({ success: true, pulses: 1 }),
    investigateHash: jest.fn().mockResolvedValue({ success: true, pulses: 10 })
}));
jest.mock('../src/services/urlscan.service', () => ({
    scan: jest.fn().mockResolvedValue({ success: true, verdicts: { malicious: true }, page: { title: 'Suspicious Login Page' } })
}));
jest.mock('../src/services/geolocation.service', () => ({
    getLocation: jest.fn().mockResolvedValue({ success: true, country: 'United States', city: 'Mountain View' })
}));
jest.mock('../src/services/asn.service', () => ({
    getASN: jest.fn().mockResolvedValue({ success: true, asn: 'AS15169', as_name: 'GOOGLE' })
}));
jest.mock('../src/services/whois.service', () => ({
    lookup: jest.fn().mockResolvedValue({ success: true, registrar: 'MarkMonitor Inc.' })
}));
jest.mock('../src/services/dns.service', () => ({
    lookup: jest.fn().mockResolvedValue({ success: true, a: ['93.184.216.34'] })
}));
jest.mock('../src/services/ssl.service', () => ({
    getCertificate: jest.fn().mockResolvedValue({ success: true, issuer: { CN: 'DigiCert' } })
}));
jest.mock('../src/services/certificate-transparency.service', () => ({
    getCertificates: jest.fn().mockResolvedValue({ success: true, certificates: ['cert1', 'cert2'] })
}));
jest.mock('../src/services/subdomain.service', () => ({
    discover: jest.fn().mockResolvedValue({ success: true, count: 4, subdomains: ['www.example.com', 'mail.example.com'] })
}));

describe('Investigate API Routes', () => {
    test('GET /api/investigate/ip/:ip should return full investigation and risk score', async () => {
        const res = await request(app).get('/api/investigate/ip/8.8.8.8');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.ioc.value).toBe('8.8.8.8');
        expect(res.body.data.risk).toHaveProperty('score');
        expect(res.body.data.risk).toHaveProperty('verdict');
        expect(res.body.data.enrichment).toHaveProperty('mitre');
        expect(res.body.data.enrichment).toHaveProperty('actor');
    });

    test('GET /api/investigate/domain/:domain should return domain investigation', async () => {
        const res = await request(app).get('/api/investigate/domain/example.com');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.ioc.value).toBe('example.com');
        expect(res.body.data.providers).toHaveProperty('virustotal');
        expect(res.body.data.providers).toHaveProperty('otx');
        expect(res.body.data.enrichment).toHaveProperty('whois');
    });

    test('GET /api/investigate/hash/:hash should return hash investigation', async () => {
        const res = await request(app).get('/api/investigate/hash/44d88612fea8a8f36de82e1278abb02f');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.ioc.type).toBe('hash');
        expect(res.body.data.risk.verdict).toBe('CRITICAL');
    });

    test('GET /api/investigate/url should return url investigation', async () => {
        const res = await request(app).get('/api/investigate/url?url=https://malicious-login.test');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.ioc.type).toBe('url');
        expect(res.body.data.providers.urlscan.verdicts.malicious).toBe(true);
    });

    test('POST /api/investigate/batch should process valid array of indicators', async () => {
        const res = await request(app)
            .post('/api/investigate/batch')
            .send({ indicators: ['8.8.8.8', 'example.com', 'https://malicious.test'] });
        
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.summary.total).toBe(3);
        expect(res.body.results).toHaveLength(3);
        expect(res.body.results[0].type).toBe('ip');
        expect(res.body.results[1].type).toBe('domain');
        expect(res.body.results[2].type).toBe('url');
    });
});
