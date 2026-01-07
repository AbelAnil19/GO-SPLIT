// Currency formatting utility
export const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
};

export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';
