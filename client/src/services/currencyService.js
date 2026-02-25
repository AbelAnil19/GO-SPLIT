// Currency conversion service using free API

const CACHE_KEY = 'currency_rates_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

// Popular currencies for quick access
export const POPULAR_CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

// Get cached rates
const getCachedRates = () => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const { rates, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid
        if (now - timestamp < CACHE_DURATION) {
            return rates;
        }

        // Cache expired
        localStorage.removeItem(CACHE_KEY);
        return null;
    } catch (error) {
        console.error('Error reading currency cache:', error);
        return null;
    }
};

// Save rates to cache
const cacheRates = (rates) => {
    try {
        const cacheData = {
            rates,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Error caching currency rates:', error);
    }
};

// Fetch currency rates from API
export const fetchCurrencyRates = async () => {
    // Check cache first
    const cachedRates = getCachedRates();
    if (cachedRates) {
        return cachedRates;
    }

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch currency rates');
        }

        const data = await response.json();
        const rates = data.rates;

        // Cache the rates
        cacheRates(rates);

        return rates;
    } catch (error) {
        console.error('Error fetching currency rates:', error);

        // Return fallback rates if API fails
        return getFallbackRates();
    }
};

// Fallback rates (approximate, for offline use)
const getFallbackRates = () => {
    return {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        INR: 83.0,
        JPY: 110.0,
        CNY: 6.45,
        AUD: 1.35,
        CAD: 1.25,
        CHF: 0.92,
        AED: 3.67
    };
};

// Convert amount from one currency to another
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    try {
        const rates = await fetchCurrencyRates();

        // Convert to USD first (base currency)
        const amountInUSD = amount / rates[fromCurrency];

        // Convert from USD to target currency
        const convertedAmount = amountInUSD * rates[toCurrency];

        return parseFloat(convertedAmount.toFixed(2));
    } catch (error) {
        console.error('Currency conversion error:', error);
        return amount; // Return original amount if conversion fails
    }
};

// Get currency symbol by code
export const getCurrencySymbol = (currencyCode) => {
    const currency = POPULAR_CURRENCIES.find(c => c.code === currencyCode);
    return currency ? currency.symbol : currencyCode;
};

// Format amount with currency symbol
export const formatCurrency = (amount, currencyCode) => {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
};

// Get all available currencies
export const getAllCurrencies = async () => {
    try {
        const rates = await fetchCurrencyRates();
        return Object.keys(rates).sort();
    } catch (error) {
        console.error('Error getting currencies:', error);
        return POPULAR_CURRENCIES.map(c => c.code);
    }
};
