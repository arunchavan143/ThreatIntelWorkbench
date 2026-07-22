const request = require('supertest');
const app = require('../src/app');
const GroqService = require('../src/services/groq.service');

describe('AI Features API Routes (Priorities 4 - 10)', () => {
    beforeAll(() => {
        // Mock Groq responses when API key is not active or to avoid external call during unit testing
        jest.spyOn(GroqService, 'chat').mockImplementation(async (messages, context) => ({
            success: true,
            reply: 'Mocked AI Chat reply explaining the TTPs and risk calculation.',
            model: 'llama-3.3-70b-versatile'
        }));

        jest.spyOn(GroqService, 'generateExportReport').mockImplementation(async (data, format) => ({
            success: true,
            format,
            report: `# Mocked AI Report (${format})\n\nThis is a synthesized SOC investigation dossier.`,
            model: 'llama-3.3-70b-versatile'
        }));

        jest.spyOn(GroqService, 'searchNaturalLanguage').mockImplementation(async (query, history) => ({
            success: true,
            query,
            answer: `Found 2 historical investigations matching query: "${query}"`,
            matching_iocs: history.slice(0, 2),
            model: 'llama-3.3-70b-versatile'
        }));
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('POST /api/investigate/chat should process messages and return AI chat response (Priority 4)', async () => {
        const response = await request(app)
            .post('/api/investigate/chat')
            .send({
                messages: [{ role: 'user', content: 'Why is this score 75?' }],
                context: { ioc: { type: 'ip', value: '1.2.3.4' } }
            });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.reply).toContain('Mocked AI Chat reply');
    });

    it('POST /api/investigate/chat should require messages array', async () => {
        const response = await request(app)
            .post('/api/investigate/chat')
            .send({ messages: 'not-an-array' });
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('POST /api/export/ai-brief should generate formatted report (Priority 5 & 7)', async () => {
        const response = await request(app)
            .post('/api/export/ai-brief')
            .send({
                data: { ioc: { type: 'ip', value: '8.8.8.8' }, risk: { score: 10, verdict: 'LOW' } },
                format: 'executive'
            });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.report).toContain('Mocked AI Report (executive)');
    });

    it('POST /api/history/ai-search should perform natural language search (Priority 10)', async () => {
        const response = await request(app)
            .post('/api/history/ai-search')
            .send({ query: 'Show me critical IPs from last week' });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.answer).toContain('Found 2 historical investigations');
    });
});
