const { validateIP, validateDomain, validateHash, validateURL, validateBatch } = require('../src/middleware/validator');

describe('Validator Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = { params: {}, query: {}, body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    describe('validateIP', () => {
        test('should call next() for valid IPv4', () => {
            req.params.ip = '8.8.8.8';
            validateIP(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        test('should return 400 for invalid IP string', () => {
            req.params.ip = 'not.an.ip.address';
            validateIP(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });

    describe('validateDomain', () => {
        test('should call next() for valid domain', () => {
            req.params.domain = 'example.com';
            validateDomain(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('should return 400 for invalid domain', () => {
            req.params.domain = '-invalid-domain-.com';
            validateDomain(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('validateHash', () => {
        test('should call next() for valid MD5 hash', () => {
            req.params.hash = '44d88612fea8a8f36de82e1278abb02f';
            validateHash(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('should return 400 for invalid hash format', () => {
            req.params.hash = 'short_hash';
            validateHash(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('validateURL', () => {
        test('should call next() for valid URL in query', () => {
            req.query.url = 'https://example.com/login';
            validateURL(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('should return 400 if missing url', () => {
            validateURL(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should return 400 for invalid protocol URL', () => {
            req.query.url = 'ftp://example.com/file';
            validateURL(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('validateBatch', () => {
        test('should call next() for valid indicators array', () => {
            req.body.indicators = ['8.8.8.8', 'example.com'];
            validateBatch(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('should return 400 if indicators array exceeds max 10', () => {
            req.body.indicators = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
            validateBatch(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should return 400 if indicators is missing or not an array', () => {
            req.body = {};
            validateBatch(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
