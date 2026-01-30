import React, { useState, useEffect } from 'react';
import { calculateUserNetBalance, checkUserCanDelete } from '../firebase/firestore';

const BalanceCheckModal = ({ isOpen, userId, onClose, onProceedToDelete }) => {
    const [loading, setLoading] = useState(true);
    const [balanceData, setBalanceData] = useState(null);
    const [deleteCheck, setDeleteCheck] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && userId) {
            loadBalanceData();
        }
    }, [isOpen, userId]);

    const loadBalanceData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [balance, check] = await Promise.all([
                calculateUserNetBalance(userId),
                checkUserCanDelete(userId)
            ]);

            setBalanceData(balance);
            setDeleteCheck(check);
        } catch (err) {
            console.error('Error loading balance data:', err);
            setError('Failed to load balance information');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative bg-white dark:bg-[#1a1c23] rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Deletion Check</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Calculating your balance...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Balance Display */}
                {!loading && balanceData && deleteCheck && (
                    <>
                        {/* Net Balance Card */}
                        <div className={`rounded-xl p-6 mb-6 ${deleteCheck.canDelete
                            ? 'bg-green-500/10 border-2 border-green-500/30'
                            : 'bg-red-500/10 border-2 border-red-500/30'
                            }`}>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Net Balance</p>
                                <p className={`text-4xl font-bold ${Math.abs(balanceData.netBalance) < 0.01
                                    ? 'text-green-600 dark:text-green-400'
                                    : balanceData.netBalance > 0
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    ₹{balanceData.netBalance.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    {Math.abs(balanceData.netBalance) < 0.01
                                        ? '✅ Your balance is settled!'
                                        : balanceData.netBalance > 0
                                            ? 'Others owe you money'
                                            : 'You owe money to others'}
                                </p>
                            </div>
                        </div>

                        {/* Balance Breakdown */}
                        <div className="bg-gray-100 dark:bg-white/5 rounded-xl p-4 mb-6">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Balance Breakdown</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Others Owe You</span>
                                    <span className="font-semibold text-green-600 dark:text-green-400">+₹{balanceData.totalOwed?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">You Owe Others</span>
                                    <span className="font-semibold text-red-600 dark:text-red-400">-₹{balanceData.totalOwe?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="h-px bg-gray-300 dark:bg-white/10 my-2"></div>
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-gray-700 dark:text-gray-300">Net Balance</span>
                                    <span className={
                                        balanceData.netBalance > 0
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400'
                                    }>
                                        ₹{balanceData.netBalance.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Blockers */}
                        {!deleteCheck.canDelete && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-red-500 text-2xl mt-0.5">warning</span>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-red-600 dark:text-red-400 mb-2">Cannot Delete Account</h4>
                                        <ul className="space-y-1">
                                            {deleteCheck.blockers.map((blocker, idx) => (
                                                <li key={idx} className="text-sm text-red-600 dark:text-red-400">
                                                    • {blocker}
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                                            Please settle all debts and transfer group ownership before deleting your account.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success - Can Delete */}
                        {deleteCheck.canDelete && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-green-500 text-2xl">check_circle</span>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-green-600 dark:text-green-400 mb-1">Ready to Delete</h4>
                                        <p className="text-sm text-green-600 dark:text-green-400">
                                            Your account has no unsettled balances and can be safely deleted.
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                            ⚠️ This action cannot be undone. All your data will be permanently deleted.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            {deleteCheck.canDelete ? (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onProceedToDelete();
                                    }}
                                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
                                >
                                    Proceed to Delete
                                </button>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-xl transition-colors"
                                >
                                    Settle Debts First
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default BalanceCheckModal;
