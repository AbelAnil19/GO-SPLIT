import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';

/**
 * Simple test component to verify currency conversion is working
 * Shows real-time conversion: 100 USD = ₹8,300
 */
const CurrencyTest = () => {
    const { currency, currencySymbol, convert, getRate } = useCurrency();
    const [testAmount, setTestAmount] = useState(100);
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [convertedAmount, setConvertedAmount] = useState(null);
    const [rate, setRate] = useState(null);

    useEffect(() => {
        const testConversion = async () => {
            try {
                const converted = await convert(testAmount, fromCurrency, currency);
                const exchangeRate = await getRate(fromCurrency, currency);

                setConvertedAmount(converted);
                setRate(exchangeRate);
            } catch (error) {
                console.error('Test conversion failed:', error);
            }
        };

        if (testAmount && fromCurrency) {
            testConversion();
        }
    }, [testAmount, fromCurrency, currency, convert, getRate]);

    const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow max-w-md">
            <h3 className="text-lg font-bold mb-4">Currency Conversion Test</h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Amount:</label>
                    <input
                        type="number"
                        value={testAmount}
                        onChange={(e) => setTestAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">From Currency:</label>
                    <select
                        value={fromCurrency}
                        onChange={(e) => setFromCurrency(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                    >
                        {currencies.map(curr => (
                            <option key={curr} value={curr}>{curr}</option>
                        ))}
                    </select>
                </div>

                <div className="pt-4 border-t">
                    <p className="text-lg font-bold">
                        {testAmount} {fromCurrency} = {currencySymbol}{convertedAmount?.toFixed(2)}
                    </p>
                    {rate && (
                        <p className="text-sm text-gray-600 mt-2">
                            Exchange Rate: 1 {fromCurrency} = {rate.toFixed(4)} {currency}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CurrencyTest;
