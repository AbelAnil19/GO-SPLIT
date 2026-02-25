import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { useCurrency } from '../context/CurrencyContext';
import ConvertedAmount from '../components/ConvertedAmount';
import { getUserExpenses } from '../firebase/firestore';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalyticsPage = () => {
    const { currentUser } = useAuth();
    const { currencySymbol } = useCurrency();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryData, setCategoryData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [stats, setStats] = useState({
        totalSpent: 0,
        avgExpense: 0,
        totalExpenses: 0,
        topCategory: ''
    });

    const COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

    const categoryIcons = {
        food: '🍔',
        travel: '✈️',
        shopping: '🛍️',
        entertainment: '🎬',
        bills: '💡',
        other: '📦'
    };

    useEffect(() => {
        loadExpenses();
    }, [currentUser]);

    const loadExpenses = async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            const userExpenses = await getUserExpenses(currentUser.uid);
            setExpenses(userExpenses);
            processAnalytics(userExpenses);
        } catch (error) {
            console.error('Error loading expenses:', error);
        }
        setLoading(false);
    };

    const processAnalytics = (expenseList) => {
        if (!expenseList || expenseList.length === 0) {
            setCategoryData([]);
            setMonthlyData([]);
            setStats({ totalSpent: 0, avgExpense: 0, totalExpenses: 0, topCategory: '' });
            return;
        }

        // Calculate user's share of each expense
        const getUserShare = (expense) => {
            // ALWAYS find user's split amount, regardless of who paid
            const userSplit = expense.splitBetween?.find(split => split.userId === currentUser.uid);
            return userSplit ? userSplit.amount : 0;
        };

        // Category breakdown (using user's share)
        const categoryTotals = {};
        expenseList.forEach(expense => {
            const cat = expense.category || 'other';
            const userShare = getUserShare(expense);
            categoryTotals[cat] = (categoryTotals[cat] || 0) + userShare;
        });

        const catData = Object.entries(categoryTotals).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: parseFloat(value.toFixed(2)),
            icon: categoryIcons[name] || '📦'
        })).sort((a, b) => b.value - a.value);

        setCategoryData(catData);

        // Monthly trend (last 6 months) - using user's share
        const monthlyTotals = {};
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            monthlyTotals[key] = 0;
        }

        expenseList.forEach(expense => {
            const date = new Date(expense.createdAt);
            const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            if (monthlyTotals.hasOwnProperty(key)) {
                const userShare = getUserShare(expense);
                monthlyTotals[key] += userShare;
            }
        });

        const monthData = Object.entries(monthlyTotals).map(([month, amount]) => ({
            month,
            amount: parseFloat(amount.toFixed(2))
        }));

        setMonthlyData(monthData);

        // Statistics (using user's share)
        const total = expenseList.reduce((sum, exp) => sum + getUserShare(exp), 0);
        const avg = total / expenseList.length;
        const topCat = catData.length > 0 ? catData[0].name : 'None';

        setStats({
            totalSpent: total.toFixed(2),
            avgExpense: avg.toFixed(2),
            totalExpenses: expenseList.length,
            topCategory: topCat
        });
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/10 rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {payload[0].name}
                    </p>
                    <p className="text-sm text-amber-400">
                        {currencySymbol}{payload[0].value}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 md:gap-6 lg:gap-8 pb-20 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="flex flex-col gap-3">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-[#0d191b] dark:text-white">
                    📊 Expense Analytics
                </h1>
                <p className="text-sm md:text-base text-[#5c6f73] dark:text-gray-400 font-normal">
                    Insights into your spending patterns and trends
                </p>
            </div>

            {expenses.length === 0 ? (
                <div className="bg-white dark:bg-white/5 rounded-2xl p-12 text-center border border-gray-300 dark:border-white/10">
                    <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">analytics</span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Expenses Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400">Add some expenses to see your analytics here</p>
                </div>
            ) : (
                <>
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white/80 text-sm font-medium">Total Spent</span>
                                <span className="material-symbols-outlined text-white">payments</span>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-white"><ConvertedAmount amount={parseFloat(stats.totalSpent)} originalCurrency="INR" /></p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white/80 text-sm font-medium">Avg Expense</span>
                                <span className="material-symbols-outlined text-white">avg_pace</span>
                            </div>
                            <p className="text-3xl font-bold text-white"><ConvertedAmount amount={parseFloat(stats.avgExpense)} originalCurrency="INR" /></p>
                        </div>

                        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white/80 text-sm font-medium">Total Expenses</span>
                                <span className="material-symbols-outlined text-white">receipt_long</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.totalExpenses}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white/80 text-sm font-medium">Top Category</span>
                                <span className="material-symbols-outlined text-white">category</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{stats.topCategory}</p>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {/* Category Breakdown Pie Chart */}
                        <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-300 dark:border-white/10 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Spending by Category
                            </h3>
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center text-gray-500">No data available</p>
                            )}
                        </div>

                        {/* Monthly Trend Line Chart */}
                        <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-300 dark:border-white/10 shadow-sm">
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Monthly Spending Trend
                            </h3>
                            {monthlyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                        <XAxis
                                            dataKey="month"
                                            stroke="#9CA3AF"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <YAxis
                                            stroke="#9CA3AF"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#F59E0B"
                                            strokeWidth={3}
                                            dot={{ fill: '#F59E0B', r: 5 }}
                                            activeDot={{ r: 7 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center text-gray-500">No data available</p>
                            )}
                        </div>
                    </div>

                    {/* Category Details Table */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-300 dark:border-white/10 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Category Breakdown
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-white/10">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categoryData.map((cat, idx) => {
                                        const percentage = ((cat.value / parseFloat(stats.totalSpent)) * 100).toFixed(1);
                                        return (
                                            <tr key={idx} className="border-b border-gray-100 dark:border-white/5">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl">{cat.icon}</span>
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</span>
                                                    </div>
                                                </td>
                                                <td className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                                                    <ConvertedAmount amount={cat.value} originalCurrency="INR" />
                                                </td>
                                                <td className="text-right py-3 px-4">
                                                    <span className="inline-block bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold">
                                                        {percentage}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AnalyticsPage;
