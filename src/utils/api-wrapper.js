const CacheService = require('../services/cache.service');
const LoggerService = require('../services/logger.service');

/**
 * Wrapper for external API calls to handle granular caching and API usage tracking.
 * @param {string} provider - The name of the provider (e.g., 'virustotal', 'shodan').
 * @param {string} type - The type of IOC (e.g., 'ip', 'domain', 'hash').
 * @param {string} ioc - The actual IOC value.
 * @param {Function} fetchFn - The async function that makes the external API call.
 * @returns {Promise<any>}
 */
async function withApiWrapper(provider, type, ioc, fetchFn) {
    const cacheKey = `${provider}:${type}:${ioc}`;

    // 1. Check granular cache
    if (CacheService.get) {
        const cached = CacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
    }

    try {
        // 2. Execute external API call
        const result = await fetchFn();

        // 3. Track API usage if successful
        if (result && result.success && LoggerService.updateApiUsage) {
            LoggerService.updateApiUsage(provider, 1).catch(err => console.error('ApiUsage Error:', err.message));
        }

        // 4. Cache successful result
        if (result && result.success && CacheService.set) {
            CacheService.set(cacheKey, result);
        }

        return result;
    } catch (error) {
        return { success: false, error: error.message, provider };
    }
}

module.exports = { withApiWrapper };
