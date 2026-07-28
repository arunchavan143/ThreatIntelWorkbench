
const path = require('path');
const db = require('../models');

class LoggerService {
    constructor() {
    }

    async logInvestigation(data) {
        try {
            if (db.Investigation) {
                await db.Investigation.create({
                    investigation_id: data.investigation_id || `inv_${Date.now()}`,
                    ioc: data.ioc,
                    type: data.type,
                    risk_score: data.risk_score,
                    verdict: data.verdict,
                    sources: data.sources,
                    timestamp: data.timestamp || new Date()
                });
            } else {
                console.error('Database Investigation model not initialized');
            }
        } catch (error) {
            console.error('Error writing investigation log to DB:', error);
            require('fs').writeFileSync('error-debug.json', JSON.stringify({ message: error.message, stack: error.stack, error: error }, null, 2));
        }
    }

    logError(error, context = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            error: error.message || error,
            stack: error.stack,
            context
        };
        console.error('ERROR LOG:', JSON.stringify(entry));
    }

    logAlert(alert, severity = 'info') {
        const entry = {
            timestamp: new Date().toISOString(),
            severity,
            alert
        };
        console.log(`ALERT [${severity}]:`, JSON.stringify(entry));
    }

    getInvestigationHistory() {
        // Warning: synchronous DB access is not possible in Node.js
        // If this is used, it should be refactored to async. Returning empty to not break sync callers unexpectedly.
        console.warn('Synchronous getInvestigationHistory is deprecated. Use getInvestigationHistoryAsync instead.');
        return [];
    }

    async getInvestigationHistoryAsync(limit = 50) {
        try {
            if (!db.Investigation) return [];
            
            const records = await db.Investigation.findAll({
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit, 10)
            });
            return records.map(record => record.toJSON());
        } catch (error) {
            console.error('Error reading async investigation history from DB:', error.message);
            return [];
        }
    }
}

module.exports = new LoggerService();