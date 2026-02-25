import React from 'react';
import { useConvertedAmount } from '../hooks/useConvertedAmount';
import { useCurrency } from '../context/CurrencyContext';
import { getCurrencySymbol } from '../utils/currencyFormatter';

/**
 * Component to display a converted amount based on user's current currency
 * Shows converted amount with tooltip of original amount
 */
const ConvertedAmount = ({ amount, originalCurrency = 'INR', className = '', showOriginal = false }) => {
    const { convertedAmount, loading, originalAmount } = useConvertedAmount(amount, originalCurrency);
    const { currency: userCurrency, currencySymbol } = useCurrency();

    // If currencies match, just show the amount
    if (!originalCurrency || originalCurrency.toUpperCase() === userCurrency.toUpperCase()) {
        return (
            <span className={className}>
                {currencySymbol}{amount?.toFixed(2)}
            </span>
        );
    }

    // Show converted amount with tooltip
    return (
        <span
            className={className}
            title={`Original: ${getCurrencySymbol(originalCurrency)}${originalAmount?.toFixed(2)}`}
        >
            {loading ? (
                <span className="opacity-50">{currencySymbol}{amount?.toFixed(2)}</span>
            ) : (
                <>
                    {currencySymbol}{convertedAmount?.toFixed(2)}
                    {showOriginal && originalCurrency !== userCurrency && (
                        <span className="text-xs text-gray-500 ml-1">
                            ({getCurrencySymbol(originalCurrency)}{originalAmount?.toFixed(2)})
                        </span>
                    )}
                </>
            )}
        </span>
    );
};

export default ConvertedAmount;
