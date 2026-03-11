import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { getUserDocument } from '../firebase/firestore';
import { getCurrencySymbol } from '../utils/currencyFormatter';
import { getExchangeRates, convertCurrency, getConversionRate } from '../services/exchangeRateService';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [currency, setCurrency] = useState('INR');
    const [currencySymbol, setCurrencySymbol] = useState('₹');
    const [loading, setLoading] = useState(true);
    const [exchangeRates, setExchangeRates] = useState({});
    const [ratesLoading, setRatesLoading] = useState(false);

    useEffect(() => {
        const loadCurrency = async () => {
            if (currentUser?.uid) {
                try {
                    const userData = await getUserDocument(currentUser.uid);
                    const userCurrency = userData?.currency || 'INR';
                    setCurrency(userCurrency);
                    setCurrencySymbol(getCurrencySymbol(userCurrency));

                    // Load exchange rates for user's currency
                    await loadExchangeRates(userCurrency);
                } catch (error) {
                    console.error('Error loading currency:', error);
                    setCurrency('INR');
                    setCurrencySymbol('₹');
                }
            } else {
                setCurrency('INR');
                setCurrencySymbol('₹');
            }
            setLoading(false);
        };

        loadCurrency();
    }, [currentUser]);

    const loadExchangeRates = async (baseCurrency = 'INR') => {
        try {
            setRatesLoading(true);
            const rates = await getExchangeRates(baseCurrency.toLowerCase());
            setExchangeRates(rates);
        } catch (error) {
            console.error('Failed to load exchange rates:', error);
        } finally {
            setRatesLoading(false);
        }
    };

    const updateCurrency = async (newCurrency) => {
        setCurrency(newCurrency);
        setCurrencySymbol(getCurrencySymbol(newCurrency));

        // Reload exchange rates for new currency
        await loadExchangeRates(newCurrency);
    };

    const convertAmount = (amount, fromCurrency) => {
        if (!amount || isNaN(amount)) return 0;
        if (!exchangeRates || Object.keys(exchangeRates).length === 0) return amount;

        const from = fromCurrency?.toLowerCase() || 'inr';
        const to = currency.toLowerCase();

        if (from === to) return amount;

        // If we have rates for the user's currency (base), and the target is user's currency
        // But the service fetches rates with fromCurrency as base.
        // Actually the context loadExchangeRates(userCurrency) means exchangeRates[other] = rate_to_get_other_from_user
        // So User -> Other is amount * exchangeRates[other]
        // Other -> User is amount / exchangeRates[other]

        const rate = exchangeRates[from];
        if (rate) {
            return amount / rate;
        }

        return amount; // Fallback
    };

    const formatAmount = (amount, fromCurrency = 'INR') => {
        const converted = convertAmount(amount, fromCurrency);
        const formatted = Number(converted).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${currencySymbol}${formatted}`;
    };

    return (
        <CurrencyContext.Provider value={{
            currency,
            currencySymbol,
            setCurrency: updateCurrency,
            loading,
            exchangeRates,
            ratesLoading,
            convert: convertCurrency,
            getRate: getConversionRate,
            convertAmount,
            formatAmount,
            refreshRates: () => loadExchangeRates(currency)
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within CurrencyProvider');
    }
    return context;
};
