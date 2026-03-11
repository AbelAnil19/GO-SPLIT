import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';
import MinimalToast from '../ui/MinimalToast';

const SetBudgetModal = ({ isOpen, onClose, onSave, currentBudget = null }) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const { currencySymbol, currency } = useCurrency();

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
        currency: currentBudget?.currency || currency, // Use current preferred currency
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
            showValidationError(t('setBudgetModal.errorInvalidAmount'));
            return;
        }

        if (budgetData.startDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(budgetData.startDate);

            if (selectedDate < today) {
                showValidationError(t('setBudgetModal.errorPastStart'));
                return;
            }
        }

        if (budgetData.startDate && budgetData.endDate) {
            if (new Date(budgetData.startDate) >= new Date(budgetData.endDate)) {
                showValidationError(t('setBudgetModal.errorEndBeforeStart'));
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
            addToast(t('setBudgetModal.successSaved'), 'success');
            onClose();
        } catch (error) {
            console.error('Error saving budget:', error);
            showValidationError(t('setBudgetModal.errorSaveFailed'));
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
                        {currentBudget ? t('setBudgetModal.editBudget') : t('setBudgetModal.setBudget')}
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
                            {t('setBudgetModal.totalBudget')}
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">{currencySymbol}</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={budgetData.total}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Only allow positive numbers and up to 2 decimal places
                                    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                        setBudgetData({ ...budgetData, total: value });
                                    }
                                }}
                                placeholder="85000"
                                className="w-full pl-8 pr-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-amber-400/50"
                            />
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('setBudgetModal.startDate')}
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
                                {t('setBudgetModal.endDate')}
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
                            {t('setBudgetModal.notesOptional')}
                        </label>
                        <textarea
                            value={budgetData.notes}
                            onChange={(e) => setBudgetData({ ...budgetData, notes: e.target.value })}
                            placeholder={t('setBudgetModal.notesPlaceholder')}
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
                            {t('setBudgetModal.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? t('setBudgetModal.saving') : t('setBudgetModal.saveBudget')}
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
