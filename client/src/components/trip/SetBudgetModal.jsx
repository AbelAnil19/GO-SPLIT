import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import MinimalToast from '../ui/MinimalToast';

const SetBudgetModal = ({ isOpen, onClose, onSave, currentBudget = null }) => {
    const { addToast } = useToast();

    // Helper function to convert Firestore Timestamp to date string
    const convertToDateString = (date) => {
        if (!date) return '';
        // Handle Firestore Timestamp objects
        if (date.toDate && typeof date.toDate === 'function') {
            return date.toDate().toISOString().split('T')[0];
        }
        // Handle regular Date objects or strings
        try {
            return new Date(date).toISOString().split('T')[0];
        } catch (e) {
            console.error('Error converting date:', e);
            return '';
        }
    };

    const [budgetData, setBudgetData] = useState({
        total: currentBudget?.total || '',
        currency: currentBudget?.currency || 'INR',
        startDate: convertToDateString(currentBudget?.startDate),
        endDate: convertToDateString(currentBudget?.endDate),
        notes: currentBudget?.notes || ''
    });
    const [loading, setLoading] = useState(false);

    // MinimalToast state for validation
    const [validationToast, setValidationToast] = useState({
        open: false,
        message: '',
        type: 'error'
    });

    if (!isOpen) return null;

    const showValidationError = (message) => {
        setValidationToast({
            open: true,
            message,
            type: 'error'
        });
        setTimeout(() => {
            setValidationToast(prev => ({ ...prev, open: false }));
        }, 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation with MinimalToast
        if (!budgetData.total || parseFloat(budgetData.total) <= 0) {
            showValidationError('Please enter a valid budget amount (must be greater than 0)');
            return;
        }

        if (budgetData.startDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(budgetData.startDate);

            if (selectedDate < today) {
                showValidationError('Start date cannot be in the past');
                return;
            }
        }

        if (budgetData.startDate && budgetData.endDate) {
            if (new Date(budgetData.startDate) >= new Date(budgetData.endDate)) {
                showValidationError('End date must be after start date');
                return;
            }
        }

        setLoading(true);

        try {
            await onSave({
                total: parseFloat(budgetData.total),
                currency: budgetData.currency,
                startDate: budgetData.startDate ? new Date(budgetData.startDate) : null,
                endDate: budgetData.endDate ? new Date(budgetData.endDate) : null,
                notes: budgetData.notes
            });
            addToast('Budget saved successfully!', 'success');
            onClose();
        } catch (error) {
            console.error('Error saving budget:', error);
            showValidationError('Failed to save budget');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a1c23] rounded-2xl w-full max-w-md border-2 border-gray-200 dark:border-white/10 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {currentBudget ? 'Edit Budget' : 'Set Budget'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Budget Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Total Budget *
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <input
                                type="number"
                                value={budgetData.total}
                                onChange={(e) => setBudgetData({ ...budgetData, total: e.target.value })}
                                placeholder="85000"
                                className="w-full pl-8 pr-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-amber-400/50"
                            />
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={budgetData.startDate}
                                onChange={(e) => setBudgetData({ ...budgetData, startDate: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-amber-400/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={budgetData.endDate}
                                onChange={(e) => setBudgetData({ ...budgetData, endDate: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-amber-400/50"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={budgetData.notes}
                            onChange={(e) => setBudgetData({ ...budgetData, notes: e.target.value })}
                            placeholder="e.g., Summer vacation budget"
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save Budget'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Validation Toast */}
            <MinimalToast
                open={validationToast.open}
                onClose={() => setValidationToast(prev => ({ ...prev, open: false }))}
                message={validationToast.message}
                type={validationToast.type}
            />
        </div>
    );
};

export default SetBudgetModal;
