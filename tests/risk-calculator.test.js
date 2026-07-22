const { calculateRisk } = require('../src/utils/risk-calculator');

describe('Risk Calculator', () => {
    test('should calculate CRITICAL risk for high detections and pulses', () => {
        const results = {
            vt: { success: true, detections: 65, ratio: '65/72' },
            abuse: { success: true, abuse_score: 95 },
            shodan: { success: true, vulnerabilities: ['CVE-2021-44228', 'CVE-2023-38606'] },
            otx: { success: true, pulses: 12 }
        };
        const risk = calculateRisk(results, { type: 'ip', value: '1.2.3.4' });
        expect(risk.verdict).toBe('CRITICAL');
        expect(risk.score).toBeGreaterThanOrEqual(80);
        expect(risk.color).toBe('#ef4444');
        expect(risk.active_sources).toBe(4);
    });

    test('should calculate LOW risk when no threats are detected across providers', () => {
        const results = {
            vt: { success: true, detections: 0, ratio: '0/72' },
            abuse: { success: true, abuse_score: 0 },
            shodan: { success: true, vulnerabilities: [] },
            otx: { success: true, pulses: 0 }
        };
        const risk = calculateRisk(results, { type: 'ip', value: '8.8.8.8' });
        expect(risk.verdict).toBe('LOW');
        expect(risk.score).toBe(0);
        expect(risk.color).toBe('#22c55e');
    });

    test('should support urlscan provider calculations correctly', () => {
        const results = {
            urlscan: { success: true, verdicts: { malicious: true, phishing: false } }
        };
        const risk = calculateRisk(results, { type: 'url', value: 'http://malicious.com' });
        expect(risk.verdict).toBe('CRITICAL');
        expect(risk.score).toBe(80);
        expect(risk.breakdown.urlscan).toBe(80);
    });

    test('should return 0 confidence when total_sources is 0 or all fail', () => {
        const results = {
            vt: { success: false },
            otx: { success: false }
        };
        const risk = calculateRisk(results, { type: 'domain', value: 'unknown.test' });
        expect(risk.score).toBe(0);
        expect(risk.active_sources).toBe(0);
        expect(risk.confidence).toBe(0);
    });
});
