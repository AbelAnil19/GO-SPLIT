import React, { useEffect, useState } from 'react';
import { calculateNetBalances, optimizeSettlements, getUnoptimizedTransactions } from '../utils/settlementOptimizer';
import { useCurrency } from '../context/CurrencyContext';

const SmartSettlementModal = ({ isOpen, onClose, expenses, members }) => {
    const { currencySymbol, formatAmount } = useCurrency();
    const [optimized, setOptimized] = useState([]);
    const [unoptimized, setUnoptimized] = useState([]);
    const [saved, setSaved] = useState(0);

    useEffect(() => {
        if (!isOpen || !expenses || !members) return;

        const balances = calculateNetBalances(expenses, members);
        const optimizedTxs = optimizeSettlements(balances, members);
        const unoptimizedTxs = getUnoptimizedTransactions(expenses, members);

        setOptimized(optimizedTxs);
        setUnoptimized(unoptimizedTxs);
        setSaved(unoptimizedTxs.length - optimizedTxs.length);
    }, [isOpen, expenses, members]);

    if (!isOpen) return null;

    const totalAmount = optimized.reduce((sum, tx) => sum + tx.amount, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white dark:bg-[#1a1c23] rounded-2xl w-full max-w-4xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-t-2xl border-b border-amber-600/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-2xl">calculate</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Smart Settlement Calculator</h2>
                                <p className="text-amber-100 text-sm">Optimized payment plan</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-green-500">check_circle</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Optimized Transactions</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{optimized.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-500">close</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Without Optimization</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{unoptimized.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-amber-500">trending_down</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Transactions Saved</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{saved}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Optimized Transactions */}
                <div className="px-6 pb-6">
                    {optimized.length === 0 ? (
                        <div className="text-center py-12 bg-gradient-to-br from-green-500/5 to-green-600/5 border border-green-500/10 rounded-xl">
                            <span className="material-symbols-outlined text-6xl text-green-500 mb-4">celebration</span>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">All Settled Up!</h3>
                            <p className="text-gray-500 dark:text-gray-400">Everyone is paid up. No settlements needed.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Optimized Payment Plan</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-base">info</span>
                                    <span>Complete these {optimized.length} transaction{optimized.length > 1 ? 's' : ''}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {optimized.map((tx, index) => (
                                    <div
                                        key={index}
                                        className="bg-gradient-to-br from-white/80 to-white/60 dark:from-white/5 dark:to-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl p-5 hover:border-amber-400/50 transition-all shadow-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                {/* From */}
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-500/30 flex items-center justify-center">
                                                        <span className="text-red-500 font-bold text-lg">{tx.fromName?.charAt(0) || 'U'}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{tx.fromName}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Pays</p>
                                                    </div>
                                                </div>

                                                {/* Arrow */}
                                                <div className="flex-1 flex items-center justify-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
                                                        <span className="material-symbols-outlined text-amber-400 text-2xl">arrow_forward</span>
                                                        <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
                                                    </div>
                                                </div>

                                                {/* To */}
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white text-right">{tx.toName}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 text-right">Receives</p>
                                                    </div>
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/30 flex items-center justify-center">
                                                        <span className="text-green-500 font-bold text-lg">{tx.toName?.charAt(0) || 'U'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="ml-6 text-right">
                                                <p className="text-3xl font-bold text-amber-500">{formatAmount(tx.amount)}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="mt-6 p-4 bg-gradient-to-br from-blue-500/5 to-blue-600/5 border border-blue-500/10 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-blue-500">trending_up</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {saved > 0 ? `${((saved / unoptimized.length) * 100).toFixed(0)}% more efficient` : 'Already optimal!'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {saved > 0 ? `Saved ${saved} transaction${saved > 1 ? 's' : ''}` : 'This is the best way to settle'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total to settle</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatAmount(totalAmount)}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 dark:bg-[#14161b] p-4 rounded-b-2xl border-t border-gray-200 dark:border-white/10">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-gray-700 dark:text-white font-semibold rounded-xl transition-all border border-gray-300 dark:border-white/10"
                        >
                            Close
                        </button>
                        <button
                            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-900/20 flex items-center gap-2"
                            onClick={() => {
                                // Copy to clipboard or share functionality can go here
                                navigator.clipboard?.writeText(
                                    optimized.map((tx, i) => `${i + 1}. ${tx.fromName} pays ${tx.toName}: ${formatAmount(tx.amount)}`).join('\n')
                                );
                                alert('Payment plan copied to clipboard!');
                            }}
                        >
                            <span className="material-symbols-outlined">content_copy</span>
                            Copy Plan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartSettlementModal;
