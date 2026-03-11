import { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';

/**
 * Hook to convert expense amounts from original currency to user's current currency
 * @param {number} amount - Original amount
 * @param {string} originalCurrency - Currency code when expense was created (e.g., 'INR', 'USD')
 * @returns {Object} { convertedAmount, loading, originalAmount, originalCurrency }
 */
export const useConvertedAmount = (amount, originalCurrency = 'INR') => {
    const { currency, convert } = useCurrency();
    const [convertedAmount, setConvertedAmount] = useState(amount);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const doConversion = async () => {
            // If same currency, no conversion needed
            if (!originalCurrency || originalCurrency.toUpperCase() === currency.toUpperCase()) {
                setConvertedAmount(amount);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const converted = await convert(amount, originalCurrency, currency);
                setConvertedAmount(converted);
            } catch (error) {
                console.error('Conversion failed:', error);
                // Fallback to original amount on error
                setConvertedAmount(amount);
            } finally {
                setLoading(false);
            }
        };

        if (amount !== null && amount !== undefined) {
            doConversion();
        }
    }, [amount, originalCurrency, currency, convert]);

    return {
        convertedAmount,
        loading,
        originalAmount: amount,
        originalCurrency: originalCurrency || 'INR'
    };
};

/**
 * Hook to convert multiple amounts in batch (more efficient than individual conversions)
 * @param {Array} items - Array of items with amount and originalCurrency
 * @returns {Object} { convertedItems, loading }
 */
export const useConvertedAmounts = (items = []) => {
    const { currency, convert } = useCurrency();
    const [convertedItems, setConvertedItems] = useState(items);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const convertAll = async () => {
            if (!items || items.length === 0) {
                setConvertedItems([]);
                return;
            }

            setLoading(true);
            try {
                const converted = await Promise.all(
                    items.map(async (item) => {
                        const itemCurrency = item.originalCurrency || 'INR';

                        // Skip conversion if same currency
                        if (itemCurrency.toUpperCase() === currency.toUpperCase()) {
                            return {
                                ...item,
                                convertedAmount: item.amount
                            };
                        }

                        const convertedAmount = await convert(item.amount, itemCurrency, currency);
                        return {
                            ...item,
                            convertedAmount
                        };
                    })
                );

                setConvertedItems(converted);
            } catch (error) {
                console.error('Batch conversion failed:', error);
                // Fallback to original amounts
                setConvertedItems(items.map(item => ({
                    ...item,
                    convertedAmount: item.amount
                })));
            } finally {
                setLoading(false);
            }
        };

        convertAll();
    }, [items, currency, convert]);

    return { convertedItems, loading };
};
