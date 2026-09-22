
const path = require('path');
const db = require('../models');
const winston = require('winston');

class LoggerService {
    constructor() {
        this.winstonLogger = winston.createLogger({
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: path.join(__dirname, '../../logs/error-debug.log') })
            ]
        });
    }

    async logInvestigation(data) {
        try {
            if (db.Investigation) {
                await db.Investigation.create({
                    investigation_id: data.investigation_id || `inv_${Date.now()}`,
                    indicator: data.ioc,
                    indicator_type: data.type,
                    risk_score: data.risk_score,
                    confidence: data.confidence || 0,
                    verdict: data.verdict,
                    provider_count: data.sources,
                    timestamp: data.timestamp || new Date()
                });
            } else {
                console.error('Database Investigation model not initialized');
            }
        } catch (error) {
            console.error('Error writing investigation log to DB:', error);
            this.winstonLogger.error('DB Write Failure', { 
                error: error.message, 
                stack: error.stack 
            });
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

    async logAiChat(conversationId, messages, summary = null) {
        try {
            if (db.AiChat) {
                await db.AiChat.create({ conversation_id: conversationId, messages, summary });
            }
        } catch (error) {
            this.winstonLogger.error('AiChat DB Write Failure', { error: error.message });
        }
    }

    async logReport(investigationId, filename, type) {
        try {
            if (db.Report) {
                await db.Report.create({ investigation_id: investigationId, filename, type });
            }
        } catch (error) {
            this.winstonLogger.error('Report DB Write Failure', { error: error.message });
        }
    }

    async updateApiUsage(provider, count = 1) {
        try {
            if (db.ApiUsage) {
                const [usage] = await db.ApiUsage.findOrCreate({ where: { provider } });
                usage.daily_requests += count;
                usage.last_request = new Date();
                await usage.save();
            }
        } catch (error) {
            this.winstonLogger.error('ApiUsage DB Write Failure', { error: error.message });
        }
    }

    async logAudit(eventType, details = {}) {
        try {
            if (db.AuditLog) {
                await db.AuditLog.create({ event_type: eventType, details });
            }
        } catch (error) {
            this.winstonLogger.error('AuditLog DB Write Failure', { error: error.message });
        }
    }
}

module.exports = new LoggerService();