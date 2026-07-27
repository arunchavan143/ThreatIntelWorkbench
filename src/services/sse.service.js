class SSEService {
    constructor() {
        this.clients = new Map(); // batchId -> { res, timer }
        this.batchProgress = new Map(); // batchId -> { total, completed, current, results }
    }

    createBatchStream(batchId, totalItems, res) {
        // Set SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        
        // Store client
        this.clients.set(batchId, { res, timer: setInterval(() => {
            // Keep-alive ping every 30 seconds
            res.write(': ping\n\n');
        }, 30000) });
        
        // Initialize progress
        this.batchProgress.set(batchId, {
            total: totalItems,
            completed: 0,
            current: null,
            results: [],
            errors: []
        });
        
        // Send initial progress
        this.sendProgress(batchId);
    }

    sendProgress(batchId, result = null) {
        const client = this.clients.get(batchId);
        if (!client) return;
        
        const progress = this.batchProgress.get(batchId);
        if (!progress) return;
        
        if (result) {
            progress.results.push(result);
            progress.completed++;
        }
        
        const data = {
            batchId,
            total: progress.total,
            completed: progress.completed,
            percentage: Math.round((progress.completed / progress.total) * 100),
            results: progress.results.slice(-5), // Last 5 results
            current: progress.current,
            done: progress.completed >= progress.total
        };
        
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        
        // If done, close stream
        if (data.done) {
            this.closeStream(batchId);
        }
    }

    sendError(batchId, error) {
        const client = this.clients.get(batchId);
        if (!client) return;
        
        const progress = this.batchProgress.get(batchId);
        if (progress) {
            progress.errors.push(error);
        }
        
        client.res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    }

    closeStream(batchId) {
        const client = this.clients.get(batchId);
        if (client) {
            if (client.timer) clearInterval(client.timer);
            client.res.end();
            this.clients.delete(batchId);
            this.batchProgress.delete(batchId);
        }
    }
}

module.exports = new SSEService();
