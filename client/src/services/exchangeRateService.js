/**
 * Currency Conversion Service using Exchange API
 * Free, unlimited API - no key required
 * https://github.com/fawazahmed0/exchange-api
 */

const CACHE_KEY = 'currency_exchange_rates';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// CDN endpoint for latest rates
const API_BASE = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1';

/**
 * Get exchange rates from API or cache
 * @param {string} baseCurrency - Base currency code (e.g., 'usd', 'inr')
 * @returns {Promise<Object>} Exchange rates object
 */
export const getExchangeRates = async (baseCurrency = 'usd') => {
    try {
        // Check cache first
        const cached = getCachedRates(baseCurrency);
        if (cached) {
            console.log('Using cached exchange rates');
            return cached;
        }

        // Fetch fresh rates
        const base = baseCurrency.toLowerCase();
        const response = await fetch(`${API_BASE}/currencies/${base}.json`);

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        // Cache the rates
        cacheRates(baseCurrency, data[base]);

        return data[base];
    } catch (error) {
        console.error('Error fetching exchange rates:', error);

        // Try to use stale cache as fallback
        const staleCache = getStaleCache(baseCurrency);
        if (staleCache) {
            console.warn('Using stale cached rates due to API error');
            return staleCache;
        }

        throw error;
    }
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} Converted amount
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
    try {
        // If same currency, no conversion needed
        if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) {
            return amount;
        }

        // Get rates with fromCurrency as base
        const rates = await getExchangeRates(fromCurrency);

        // Get the conversion rate
        const rate = rates[toCurrency.toLowerCase()];

        if (!rate) {
            throw new Error(`No conversion rate found for ${toCurrency}`);
        }

        return amount * rate;
    } catch (error) {
        console.error('Currency conversion error:', error);
        throw error;
    }
};

/**
 * Get conversion rate between two currencies
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} Exchange rate
 */
export const getConversionRate = async (fromCurrency, toCurrency) => {
    try {
        if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) {
            return 1;
        }

        const rates = await getExchangeRates(fromCurrency);
        const rate = rates[toCurrency.toLowerCase()];

        if (!rate) {
            throw new Error(`No conversion rate found for ${toCurrency}`);
        }

        return rate;
    } catch (error) {
        console.error('Error getting conversion rate:', error);
        return null;
    }
};

/**
 * Get all available currencies
 * @returns {Promise<Array>} List of currency codes
 */
export const getAvailableCurrencies = async () => {
    try {
        const response = await fetch(`${API_BASE}/currencies.json`);
        const data = await response.json();
        return Object.keys(data);
    } catch (error) {
        console.error('Error fetching currencies:', error);
        return [];
    }
};

// ============ Cache Management ============

/**
 * Cache rates in localStorage
 */
const cacheRates = (baseCurrency, rates) => {
    const cacheData = {
        baseCurrency,
        rates,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION
    };

    try {
        localStorage.setItem(`${CACHE_KEY}_${baseCurrency}`, JSON.stringify(cacheData));
    } catch (error) {
        console.warn('Failed to cache rates:', error);
    }
};

/**
 * Get cached rates if still valid
 */
const getCachedRates = (baseCurrency) => {
    try {
        const cached = localStorage.getItem(`${CACHE_KEY}_${baseCurrency}`);
        if (!cached) return null;

        const data = JSON.parse(cached);

        // Check if cache is still valid
        if (Date.now() < data.expiresAt) {
            return data.rates;
        }

        return null;
    } catch (error) {
        console.warn('Failed to read cache:', error);
        return null;
    }
};

/**
 * Get stale cache as fallback (even if expired)
 */
const getStaleCache = (baseCurrency) => {
    try {
        const cached = localStorage.getItem(`${CACHE_KEY}_${baseCurrency}`);
        if (!cached) return null;

        const data = JSON.parse(cached);
        return data.rates;
    } catch (error) {
        return null;
    }
};

/**
 * Clear all cached rates
 */
export const clearCache = () => {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_KEY)) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.warn('Failed to clear cache:', error);
    }
};

/**
 * Force refresh rates (bypass cache)
 */
export const refreshRates = async (baseCurrency = 'usd') => {
    try {
        // Clear cache for this currency
        localStorage.removeItem(`${CACHE_KEY}_${baseCurrency}`);

        // Fetch fresh rates
        return await getExchangeRates(baseCurrency);
    } catch (error) {
        console.error('Failed to refresh rates:', error);
        throw error;
    }
};

export default {
    getExchangeRates,
    convertCurrency,
    getConversionRate,
    getAvailableCurrencies,
    clearCache,
    refreshRates
};
