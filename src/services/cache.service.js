const NodeCache = require('node-cache');

class CacheService {
    constructor() {
        this.cache = new NodeCache({
            stdTTL: parseInt(process.env.CACHE_TTL_SECONDS) || 1800,
            checkperiod: 60
        });
        this.hits = 0;
        this.misses = 0;
    }

    get(key) {
        const value = this.cache.get(key);
        if (value) {
            this.hits++;
            return value;
        }
        this.misses++;
        return null;
    }

    set(key, value, ttl = null) {
        if (ttl) {
            this.cache.set(key, value, ttl);
        } else {
            this.cache.set(key, value);
        }
        return true;
    }

    del(key) {
        return this.cache.del(key);
    }

    flush() {
        this.cache.flushAll();
        this.hits = 0;
        this.misses = 0;
        return true;
    }

    getStats() {
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: this.hits + this.misses > 0 
                ? Math.round((this.hits / (this.hits + this.misses)) * 100) 
                : 0,
            keys: this.cache.keys().length,
            ttl: this.cache.options.stdTTL
        };
    }

    generateKey(ioc) {
        return `${ioc.type}:${ioc.value.toLowerCase()}`;
    }
}

module.exports = new CacheService();