const request = require('supertest');
const app = require('../src/app');

describe('Health & Info Endpoints', () => {
    test('GET /health should return 200 and health status', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('healthy');
        expect(res.body).toHaveProperty('uptime');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('apis');
    });

    test('GET /api should return 200 and API metadata with dynamic version', async () => {
        const res = await request(app).get('/api');
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Threat Intel Workbench Pro');
        expect(res.body.version).toBe('4.0.0');
        expect(res.body.status).toBe('operational');
        expect(res.body).toHaveProperty('endpoints');
    });

    test('GET /unknown-api-route should return 404 JSON', async () => {
        const res = await request(app).get('/api/doesnotexist');
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Not found');
    });
});
