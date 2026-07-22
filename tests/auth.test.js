const { validateApiKey } = require('../src/middleware/auth');

describe('Auth Middleware (validateApiKey)', () => {
    let req, res, next;
    const originalEnv = process.env.WORKBENCH_API_KEY;

    beforeEach(() => {
        req = { headers: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    afterEach(() => {
        if (originalEnv === undefined) delete process.env.WORKBENCH_API_KEY;
        else process.env.WORKBENCH_API_KEY = originalEnv;
    });

    test('should allow pass-through next() when WORKBENCH_API_KEY is not set', () => {
        delete process.env.WORKBENCH_API_KEY;
        delete process.env.API_KEY;
        validateApiKey(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 401 when WORKBENCH_API_KEY is configured and no header is provided', () => {
        process.env.WORKBENCH_API_KEY = 'secret-test-key-123';
        validateApiKey(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: expect.stringContaining('Unauthorized')
        }));
    });

    test('should allow pass-through when x-api-key matches WORKBENCH_API_KEY', () => {
        process.env.WORKBENCH_API_KEY = 'secret-test-key-123';
        req.headers['x-api-key'] = 'secret-test-key-123';
        validateApiKey(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('should allow pass-through when authorization Bearer header matches WORKBENCH_API_KEY', () => {
        process.env.WORKBENCH_API_KEY = 'secret-test-key-123';
        req.headers['authorization'] = 'Bearer secret-test-key-123';
        validateApiKey(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
