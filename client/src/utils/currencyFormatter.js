// Currency formatting utility
// Automatically uses the correct currency symbol based on user's settings

const CURRENCY_SYMBOLS = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: '$',
    CAD: '$',
    SGD: '$',
    AED: 'د.إ',
    CNY: '¥'
};

/**
 * Format amount with currency symbol
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (INR, USD, etc.)
 * @returns {string} Formatted string with currency symbol
 */
export const formatCurrency = (amount, currency = 'INR') => {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const formattedAmount = parseFloat(amount).toFixed(2);

    // For currencies like AED that go before, adjust as needed
    if (currency === 'AED') {
        return `${symbol}${formattedAmount}`;
    }

    // Most currencies: symbol before amount
    return `${symbol}${formattedAmount}`;
};

/**
 * Get currency symbol only
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency = 'INR') => {
    return CURRENCY_SYMBOLS[currency] || currency;
};

/**
 * Example usage in components:
 * 
 * Instead of:
 *   ₹{expense.amount.toFixed(2)}
 * 
 * Use:
 *   {formatCurrency(expense.amount, userCurrency)}
 * 
 * Where userCurrency comes from user settings/context
 */
