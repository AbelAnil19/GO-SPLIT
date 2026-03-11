import React, { useState, useEffect } from 'react';
import { getAllExpenses, adminDeleteExpense } from '../../firebase/firestore';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/admin/AdminLayout';
import { useCurrency } from '../../context/CurrencyContext';

const ExpenseManagement = () => {
    const { formatAmount } = useCurrency();
    const { addToast } = useToast();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        try {
            const fetchedExpenses = await getAllExpenses();
            setExpenses(fetchedExpenses);
        } catch (error) {
            console.error('Error loading expenses:', error);
            addToast('Failed to load expenses', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExpense = async (expenseId, description) => {
        if (!confirm(`Are you sure you want to delete expense "${description}"?`)) {
            return;
        }

        try {
            await adminDeleteExpense(expenseId);
            addToast('Expense deleted successfully', 'success');
            loadExpenses();
        } catch (error) {
            console.error('Error deleting expense:', error);
            addToast('Failed to delete expense', 'error');
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </AdminLayout>
        );
    }

    const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    return (
        <AdminLayout>
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-[#0d191b] dark:text-white mb-2">Expense Management</h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Monitor all expenses across the platform</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-4 md:p-6">
                    <div className="text-xl md:text-3xl font-bold text-[#0d191b] dark:text-white mb-1">{expenses.length}</div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total Expenses</div>
                </div>
                <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-4 md:p-6">
                    <div className="text-xl md:text-3xl font-bold text-[#0d191b] dark:text-white mb-1">{formatAmount(totalAmount)}</div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total Amount</div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-white/5 border-b-2 border-gray-200 dark:border-white/10">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 dark:text-gray-400">Description</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 dark:text-gray-400">Amount</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 dark:text-gray-400">Added By</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 dark:text-gray-400">Date</th>
                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-600 dark:text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {expenses.map((expense) => (
                                <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-[#0d191b] dark:text-white">{expense.description}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-green-500">{formatAmount(expense.amount || 0)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">
                                                {expense.paidByName?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {expense.paidByName || 'Unknown'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {expense.date?.toDate ? expense.date.toDate().toLocaleDateString() : 'N/A'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => handleDeleteExpense(expense.id, expense.description)}
                                                className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default ExpenseManagement;
