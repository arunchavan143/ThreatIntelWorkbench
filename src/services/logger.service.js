const fs = require('fs');
const path = require('path');

class LoggerService {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.ensureLogDirectory();
        this.investigationsFile = path.join(this.logDir, 'investigations.jsonl');
        this.errorsFile = path.join(this.logDir, 'errors.log');
        this.alertsFile = path.join(this.logDir, 'alerts.log');
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    logInvestigation(data) {
        const entry = {
            timestamp: new Date().toISOString(),
            ...data
        };
        fs.appendFile(this.investigationsFile, JSON.stringify(entry) + '\n', (err) => {
            if (err) console.error('Error writing investigation log:', err.message);
        });
    }

    logError(error, context = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            error: error.message || error,
            stack: error.stack,
            context
        };
        fs.appendFile(this.errorsFile, JSON.stringify(entry) + '\n', (err) => {
            if (err) console.error('Error writing error log:', err.message);
        });
    }

    logAlert(alert, severity = 'info') {
        const entry = {
            timestamp: new Date().toISOString(),
            severity,
            alert
        };
        fs.appendFile(this.alertsFile, JSON.stringify(entry) + '\n', (err) => {
            if (err) console.error('Error writing alert log:', err.message);
        });
    }

    getInvestigationHistory(limit = 50) {
        try {
            if (!fs.existsSync(this.investigationsFile)) {
                return [];
            }
            const content = fs.readFileSync(this.investigationsFile, 'utf8');
            const lines = content.trim().split('\n');
            const investigations = lines
                .filter(line => line.trim())
                .map(line => JSON.parse(line))
                .reverse()
                .slice(0, limit);
            return investigations;
        } catch (error) {
            console.error('Error reading investigation history:', error);
            return [];
        }
    }

    async getInvestigationHistoryAsync(limit = 50) {
        try {
            if (!fs.existsSync(this.investigationsFile)) {
                return [];
            }
            const content = await fs.promises.readFile(this.investigationsFile, 'utf8');
            const lines = content.trim().split('\n');
            const investigations = lines
                .filter(line => line.trim())
                .map(line => JSON.parse(line))
                .reverse()
                .slice(0, limit);
            return investigations;
        } catch (error) {
            console.error('Error reading async investigation history:', error);
            return [];
        }
    }
}

module.exports = new LoggerService();