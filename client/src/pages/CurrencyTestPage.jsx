import React from 'react';
import CurrencyTest from '../components/CurrencyTest';

const CurrencyTestPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0d191b] p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                    Currency Conversion Test
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Testing real-time currency conversion using Exchange API (FREE, unlimited)
                </p>

                <div className="grid gap-8">
                    <CurrencyTest />

                    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <h2 className="text-lg font-bold mb-4">How it works:</h2>
                        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <li>✅ Uses Exchange API (free, unlimited requests)</li>
                            <li>✅ Caches rates for 24 hours (only ~1 API call/day)</li>
                            <li>✅ Real conversion: $100 = ₹8,300</li>
                            <li>✅ Works offline with cached rates</li>
                            <li>✅ Supports 200+ currencies</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CurrencyTestPage;
