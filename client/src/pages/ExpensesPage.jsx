import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';
import { deleteExpense } from '../firebase/firestore';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { calculateTotalBalance } from '../utils/expenseCalculator';
import AddExpenseModal from '../components/AddExpenseModal';
import RecurringExpenseModal from '../components/RecurringExpenseModal';
import { createRecurringTemplate } from '../services/recurringExpenseService';
import ConfirmationModal from '../components/ConfirmationModal';
import { useCurrency } from '../context/CurrencyContext';
import ConvertedAmount from '../components/ConvertedAmount';
import ReceiptViewer from '../components/ReceiptViewer';
import { useTranslation } from 'react-i18next';

const ExpensesPage = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const { currencySymbol } = useCurrency();
    const [searchQuery, setSearchQuery] = useState('');
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'owe', 'owed'
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, expense: null });

    // Fetch expenses with real-time listener
    useEffect(() => {
        if (!currentUser) return;

        setLoading(true);

        // Real-time listener for expenses
        const q = query(
            collection(db, 'expenses'),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const expensesData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(expense =>
                    // Filter to only expenses where user is involved
                    expense.paidBy === currentUser.uid ||
                    expense.splitBetween.some(split => split.userId === currentUser.uid)
                );

            setExpenses(expensesData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching expenses:', error);
            addToast(t('expenses.failedLoad'), 'error');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Calculate balance
    const totalBalance = calculateTotalBalance(expenses, currentUser?.uid);

    // Filter expenses
    const getFilteredExpenses = () => {
        let filtered = expenses;

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(expense =>
                expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                expense.paidByName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply status filter
        if (filter === 'owe') {
            filtered = filtered.filter(expense =>
                expense.paidBy !== currentUser.uid &&
                expense.splitBetween.some(split => split.userId === currentUser.uid)
            );
        } else if (filter === 'owed') {
            filtered = filtered.filter(expense => expense.paidBy === currentUser.uid);
        }

        return filtered;
    };

    // Group expenses by date
    const groupExpensesByDate = (expenses) => {
        const groups = {};
        const now = new Date();

        expenses.forEach(expense => {
            const date = (expense.date && expense.date.toDate) ? expense.date.toDate() : new Date(expense.date || Date.now());
            const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            // Determine label (Today, Yesterday, or date)
            const diffTime = now - date;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let label;
            if (diffDays === 0) {
                label = t('expenses.today');
            } else if (diffDays === 1) {
                label = t('expenses.yesterday');
            } else {
                label = dateKey;
            }

            if (!groups[label]) {
                groups[label] = [];
            }
            groups[label].push(expense);
        });

        return groups;
    };

    const filteredExpenses = getFilteredExpenses();
    const groupedExpenses = groupExpensesByDate(filteredExpenses);

    // Calculate user's share for an expense
    const getUserAmount = (expense) => {
        if (expense.paidBy === currentUser.uid) {
            const userSplit = expense.splitBetween.find(s => s.userId === currentUser.uid);
            const userOwes = userSplit ? userSplit.amount : 0;
            return { amount: expense.amount - userOwes, type: 'lent' };
        } else {
            const userSplit = expense.splitBetween.find(s => s.userId === currentUser.uid);
            return { amount: userSplit?.amount || 0, type: 'borrowed' };
        }
    };

    // Get category icon and color
    const getCategoryStyle = (category) => {
        const styles = {
            food: { icon: 'restaurant', color: 'emerald' },
            travel: { icon: 'flight', color: 'blue' },
            shopping: { icon: 'shopping_bag', color: 'purple' },
            entertainment: { icon: 'movie', color: 'pink' },
            bills: { icon: 'receipt_long', color: 'orange' },
            settlement: { icon: 'payments', color: 'green' },
            other: { icon: 'category', color: 'gray' }
        };
        return styles[category] || styles.other;
    };

    const handleDeleteClick = (expense) => {
        setDeleteModal({ isOpen: true, expense });
    };

    const confirmDeleteExpense = async () => {
        if (!deleteModal.expense) return;

        try {
            await deleteExpense(deleteModal.expense.id, deleteModal.expense.groupId, deleteModal.expense.amount);
            addToast(t('expenses.deleteSuccess'), 'success');
        } catch (error) {
            console.error('Error deleting expense:', error);
            addToast(t('expenses.deleteError'), 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-400 border-t-transparent"></div>
                    <p className="mt-4 text-gray-400">{t('expenses.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 md:gap-6 lg:gap-8 pb-20 md:pb-24 max-w-7xl mx-auto">
            {/* Page Heading & Balance */}
            <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm border border-gray-300 dark:border-white/10 backdrop-blur-md">
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-[#0d191b] dark:text-white">{t('expenses.pageTitle')}</h1>
                        <div className="flex items-center gap-2">
                            <p className="text-sm md:text-base text-[#5c6f73] dark:text-gray-400 font-normal">{t('expenses.totalBalance')}</p>
                            <span className={`font-bold text-lg px-2 py-0.5 rounded ${totalBalance >= 0
                                ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-400/10'
                                : 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-400/10'
                                }`}>
                                {totalBalance >= 0 ? '+' : ''}{currencySymbol}{totalBalance.toFixed(2)}
                            </span>
                            <span className="text-gray-400 text-sm">
                                {totalBalance >= 0 ? t('expenses.youAreOwed') : t('expenses.youOwe')}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsRecurringModalOpen(true)}
                            className="bg-purple-500 hover:bg-purple-600 text-white h-12 rounded-lg text-sm font-bold flex items-center gap-2 px-4 shadow-lg shadow-purple-900/20 transition-all"
                            title={t('expenses.setupRecurring')}
                        >
                            <span className="material-symbols-outlined">event_repeat</span>
                            {t('expenses.recurring')}
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-amber-400 hover:bg-amber-300 text-black h-12 rounded-lg text-sm font-bold flex items-center gap-2 px-6 shadow-lg shadow-amber-900/20 transition-all"
                        >
                            <span className="material-symbols-outlined">add</span>
                            {t('expenses.addExpense')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[240px]">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined">search</span>
                    <input
                        className="w-full h-12 pl-12 pr-4 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all placeholder:text-gray-400 text-sm font-medium text-[#0d191b] dark:text-white backdrop-blur-md"
                        placeholder={t('expenses.searchPlaceholder')}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {/* Filter Chips */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    <button
                        onClick={() => setFilter('all')}
                        className={`flex items-center gap-2 h-12 px-4 rounded-lg whitespace-nowrap transition-colors backdrop-blur-md ${filter === 'all'
                            ? 'bg-amber-400/10 border border-amber-400/20 text-amber-400 font-bold'
                            : 'bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-[#0d191b] dark:text-white hover:border-amber-400/50'
                            }`}
                    >
                        <span className="text-sm font-medium">{t('expenses.filterAll')}</span>
                    </button>
                    <button
                        onClick={() => setFilter('owe')}
                        className={`flex items-center gap-2 h-12 px-4 rounded-lg whitespace-nowrap transition-colors backdrop-blur-md ${filter === 'owe'
                            ? 'bg-amber-400/10 border border-amber-400/20 text-amber-400 font-bold'
                            : 'bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-[#0d191b] dark:text-white hover:border-amber-400/50'
                            }`}
                    >
                        <span className="text-sm font-medium">{t('expenses.filterOwe')}</span>
                    </button>
                    <button
                        onClick={() => setFilter('owed')}
                        className={`flex items-center gap-2 h-12 px-4 rounded-lg whitespace-nowrap transition-colors backdrop-blur-md ${filter === 'owed'
                            ? 'bg-amber-400/10 border border-amber-400/20 text-amber-400 font-bold'
                            : 'bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-[#0d191b] dark:text-white hover:border-amber-400/50'
                            }`}
                    >
                        <span className="text-sm font-medium">{t('expenses.filterOwed')}</span>
                    </button>
                </div>
            </div>

            {/* Expense List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-400 border-t-transparent"></div>
                    <p className="mt-4 text-[#5c6f73] dark:text-gray-400">{t('expenses.loading')}</p>
                </div>
            ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-16">
                    <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">receipt_long</span>
                    <p className="text-gray-400 text-lg">
                        {searchQuery ? t('expenses.noMatch') : t('expenses.noExpenses')}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="mt-4 text-amber-400 hover:text-amber-300 font-medium"
                        >
                            {t('expenses.addFirst')}
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {Object.entries(groupedExpenses).map(([dateLabel, dateExpenses]) => (
                        <div key={dateLabel} className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider pl-1">{dateLabel}</h3>

                            {dateExpenses.map(expense => {
                                const { amount, type } = getUserAmount(expense);
                                const categoryStyle = getCategoryStyle(expense.category);

                                return (
                                    <div
                                        key={expense.id}
                                        className="group flex flex-col sm:flex-row gap-4 bg-white dark:bg-white/5 p-4 rounded-xl shadow-sm border border-transparent hover:border-amber-400/20 transition-all cursor-pointer backdrop-blur-md"
                                    >
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={`shrink-0 size-12 rounded-full bg-${categoryStyle.color}-500/10 flex items-center justify-center text-${categoryStyle.color}-400`}>
                                                <span className="material-symbols-outlined">{categoryStyle.icon}</span>
                                            </div>
                                            <div className="flex flex-col justify-center gap-0.5">
                                                <p className="text-base font-bold text-[#0d191b] dark:text-white">{expense.description}</p>
                                                <p className="text-sm text-gray-400">
                                                    {expense.paidByName} {t('expenses.paid')} <ConvertedAmount amount={expense.amount} originalCurrency={expense.originalCurrency || 'INR'} />
                                                </p>
                                            </div>
                                        </div>

                                        {/* Receipt Viewer */}
                                        {expense.receipt && (
                                            <div className="mt-3 border-t border-gray-200 dark:border-white/10 pt-3">
                                                <ReceiptViewer receipt={expense.receipt} />
                                            </div>
                                        )}

                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 pl-16 sm:pl-0">
                                            <span className={`text-xs font-semibold uppercase tracking-wider ${type === 'lent' ? 'text-green-400' : 'text-orange-400'
                                                }`}>
                                                {type === 'lent' ? t('expenses.youLent') : t('expenses.youBorrowed')}
                                            </span>
                                            <span className={`text-base font-bold ${type === 'lent' ? 'text-green-400' : 'text-orange-400'
                                                }`}>
                                                <ConvertedAmount amount={amount} originalCurrency={expense.originalCurrency || 'INR'} />
                                            </span>
                                            {/* Delete Button */}
                                            {expense.paidBy === currentUser.uid && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(expense);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all absolute top-2 right-2 sm:static sm:opacity-0 sm:group-hover:opacity-100"
                                                    title={t('expenses.deleteTooltip')}
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Load More */}
                    {filteredExpenses.length > 20 && (
                        <div className="flex justify-center pt-4">
                            <button className="text-gray-400 hover:text-amber-400 text-sm font-bold transition-colors">
                                {t('expenses.showEarlier')}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Add Expense Modal */}
            <AddExpenseModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onExpenseAdded={() => {
                    // Expenses will update automatically via real-time listener
                }}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, expense: null })}
                onConfirm={confirmDeleteExpense}
                title={t('expenses.deleteTitle')}
                message={t('expenses.deleteConfirm').replace('{description}', deleteModal.expense?.description)}
                confirmText={t('common.delete')}
                type="danger"
            />

            {/* Recurring Expense Modal */}
            <RecurringExpenseModal
                isOpen={isRecurringModalOpen}
                onClose={() => setIsRecurringModalOpen(false)}
                onSave={async (template) => {
                    try {
                        await createRecurringTemplate(template);
                        addToast(t('expenses.recurringSuccess'), 'success');
                        setIsRecurringModalOpen(false);
                    } catch (error) {
                        console.error('Error creating recurring expense:', error);
                        addToast(t('expenses.recurringError'), 'error');
                    }
                }}
            />
        </div>
    );
};

export default ExpensesPage;
