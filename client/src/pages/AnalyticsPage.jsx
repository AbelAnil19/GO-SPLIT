import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { useCurrency } from '../context/CurrencyContext';
import ConvertedAmount from '../components/ConvertedAmount';
import { getUserExpenses, listenToUserGroups, updateUserDocument, getUserDocument } from '../firebase/firestore';
import { getUserRecurringTemplates, processRecurringExpenses } from '../services/recurringExpenseService';
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SpendingHeatmap from '../components/SpendingHeatmap';
import { useTranslation } from 'react-i18next';

const AnalyticsPage = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const { currencySymbol, formatAmount, convertAmount } = useCurrency();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryData, setCategoryData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [groupSpendData, setGroupSpendData] = useState([]);
    const [groups, setGroups] = useState([]);
    const [recurringExpenses, setRecurringExpenses] = useState([]);
    const [monthlyBudget, setMonthlyBudget] = useState(5000); // Base INR budget by default
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [budgetInput, setBudgetInput] = useState('');
    const [isSavingBudget, setIsSavingBudget] = useState(false);
    const [stats, setStats] = useState({
        totalSpent: 0,
        lastMonthSpent: 0,
        avgExpense: 0,
        totalExpenses: 0,
        topCategory: '',
        budgetStatus: 'under', // 'under', 'warning', 'over'
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
            // Fetch user profile for custom budget
            const userProfile = await getUserDocument(currentUser.uid);
            if (userProfile && userProfile.monthlyBudget) {
                setMonthlyBudget(userProfile.monthlyBudget);
            }

            // Process recurring expenses to evaluate overdue subscriptions and update their Next Dates
            await processRecurringExpenses(currentUser.uid);

            // Fetch underlying data
            const userExpenses = await getUserExpenses(currentUser.uid);
            const userRecurring = await getUserRecurringTemplates(currentUser.uid);

            setExpenses(userExpenses);
            setRecurringExpenses(userRecurring.filter(ex => ex.isActive));

            // We need groups for resolution, so wait for groups to load via listener or process later
        } catch (error) {
            console.error('Error loading analytics data:', error);
        }
    };

    // Keep data fresh by re-processing when core datasets change
    useEffect(() => {
        if (expenses.length > 0 && groups.length >= 0) {
            processAnalytics(expenses);
        } else if (!loading) {
            processAnalytics([]);
        }
    }, [expenses, groups, loading, monthlyBudget]);

    // Setup listener for user groups
    useEffect(() => {
        if (!currentUser) return;
        const unsubscribe = listenToUserGroups(currentUser.uid, (groupsData) => {
            setGroups(groupsData);
            if (loading) setLoading(false);
        });
        return () => unsubscribe();
    }, [currentUser]);

    const processAnalytics = (expenseList) => {
        if (!expenseList || expenseList.length === 0) {
            setCategoryData([]);
            setMonthlyData([]);
            setGroupSpendData([]);
            setStats({ totalSpent: 0, lastMonthSpent: 0, avgExpense: 0, totalExpenses: 0, topCategory: '', budgetStatus: 'under' });
            return;
        }

        const getUserShare = (expense) => {
            const userSplit = expense.splitBetween?.find(split => split.userId === currentUser.uid);
            return userSplit ? userSplit.amount : 0;
        };

        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(startOfThisMonth.getTime() - 1);

        // Core Aggregations
        const categoryTotals = {};
        const groupTotals = {};
        let thisMonthSpent = 0;
        let lastMonthSpent = 0;

        // Month-over-Month Cumulative Arrays
        const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysInLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        const thisMonthCumulative = Array(daysInCurrentMonth + 1).fill(0);
        const lastMonthCumulative = Array(daysInLastMonth + 1).fill(0);

        expenseList.forEach(expense => {
            const userShare = getUserShare(expense);
            if (userShare <= 0) return;

            const expenseDate = expense.createdAt || expense.date;
            const date = expenseDate?.toDate ? expenseDate.toDate() : new Date(expenseDate);

            // Category tracking (all time)
            const cat = expense.category || 'other';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + userShare;

            // Group tracking (all time)
            if (expense.groupId) {
                groupTotals[expense.groupId] = (groupTotals[expense.groupId] || 0) + userShare;
            }

            // Timeline calculations
            if (date >= startOfThisMonth) {
                thisMonthSpent += userShare;
                const day = date.getDate();
                thisMonthCumulative[day] += userShare;
            } else if (date >= startOfLastMonth && date <= endOfLastMonth) {
                lastMonthSpent += userShare;
                const day = date.getDate();
                lastMonthCumulative[day] += userShare;
            }
        });

        // Resolve Category Data
        const catData = Object.entries(categoryTotals).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: parseFloat(value.toFixed(2)),
            icon: categoryIcons[name] || '📦'
        })).sort((a, b) => b.value - a.value);
        setCategoryData(catData);

        // Resolve Group Spend Data
        const groupData = Object.entries(groupTotals).map(([groupId, value]) => {
            const groupObj = groups.find(g => g.id === groupId);
            return {
                name: groupObj ? groupObj.name : 'Unknown Group',
                value: parseFloat(value.toFixed(2))
            };
        }).sort((a, b) => b.value - a.value).slice(0, 5); // top 5 groups
        setGroupSpendData(groupData);

        // Build MoM Trend Line Data
        let cmRunning = 0;
        let lmRunning = 0;
        const trendData = [];
        const maxDays = Math.max(daysInCurrentMonth, daysInLastMonth);

        for (let i = 1; i <= maxDays; i++) {
            if (i <= daysInCurrentMonth) cmRunning += thisMonthCumulative[i];
            if (i <= daysInLastMonth) lmRunning += lastMonthCumulative[i];

            trendData.push({
                day: i.toString(),
                currentMonth: i <= now.getDate() ? parseFloat(cmRunning.toFixed(2)) : null, // stop drawing future days
                lastMonth: parseFloat(lmRunning.toFixed(2))
            });
        }
        setMonthlyData(trendData);

        // Resolve Budget Status (calculated in base currency)
        const spentRatio = thisMonthSpent / monthlyBudget;
        let bStatus = 'under';
        if (spentRatio >= 1) bStatus = 'over';
        else if (spentRatio >= 0.8) bStatus = 'warning';

        // Overall Stats
        setStats({
            totalSpent: thisMonthSpent.toFixed(2),
            lastMonthSpent: lastMonthSpent.toFixed(2),
            avgExpense: (thisMonthSpent / Math.max(now.getDate(), 1)).toFixed(2), // avg per day this month
            totalExpenses: expenseList.length,
            topCategory: catData.length > 0 ? catData[0].name : 'None',
            budgetStatus: bStatus
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
                    📊 {t('analytics.pageTitle')}
                </h1>
                <p className="text-sm md:text-base text-[#5c6f73] dark:text-gray-400 font-normal">
                    {t('analytics.pageDescription')}
                </p>
            </div>

            {/* Budget Progress Bar */}
            {!loading && expenses.length > 0 && (
                <div className="bg-gradient-to-br from-white/20 to-white/10 dark:from-white/[0.04] dark:to-transparent backdrop-blur-[2px] shadow-md dark:shadow-none rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-white/10 mb-2">
                    <div className="flex justify-between items-end mb-3 gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">{t('analytics.monthlyBudgetTracker')}</h3>
                                <button
                                    onClick={() => {
                                        setBudgetInput(convertAmount(monthlyBudget, 'INR').toString());
                                        setIsEditingBudget(true);
                                    }}
                                    className="text-gray-400 hover:text-amber-500 transition-colors shrink-0"
                                >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                            </div>
                            <div className="flex flex-wrap items-end gap-x-2 gap-y-0.5">
                                <span className={`text-xl sm:text-2xl font-black truncate ${stats.budgetStatus === 'over' ? 'text-red-500' : stats.budgetStatus === 'warning' ? 'text-amber-500' : 'text-green-500'}`}>
                                    <ConvertedAmount amount={parseFloat(stats.totalSpent)} originalCurrency="INR" />
                                </span>
                                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1 font-medium truncate">/ <ConvertedAmount amount={monthlyBudget} originalCurrency="INR" /></span>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <span className={`text-[10px] sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${stats.budgetStatus === 'over' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : stats.budgetStatus === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                                {((stats.totalSpent / monthlyBudget) * 100).toFixed(0)}% {t('analytics.utilized')}
                            </span>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex relative">
                        <div
                            className={`h-full transition-all duration-1000 ease-out rounded-full ${stats.budgetStatus === 'over' ? 'bg-red-500' : stats.budgetStatus === 'warning' ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min((stats.totalSpent / monthlyBudget) * 100, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {stats.budgetStatus === 'over' ? t('analytics.budgetOver') : stats.budgetStatus === 'warning' ? t('analytics.budgetWarning') : t('analytics.budgetOnTrack')}
                    </p>
                </div>
            )}

            {expenses.length === 0 ? (
                <div className="bg-gradient-to-br from-white/20 to-white/10 dark:from-white/[0.04] dark:to-transparent backdrop-blur-[2px] shadow-md dark:shadow-none rounded-2xl p-12 text-center border border-gray-200 dark:border-white/10">
                    <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">analytics</span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('analytics.noExpensesTitle')}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{t('analytics.noExpensesDesc')}</p>
                </div>
            ) : (
                <>
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-4 sm:p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                                <span className="text-white/80 text-xs sm:text-sm font-medium">{t('analytics.totalSpent')}</span>
                                <span className="material-symbols-outlined text-white text-lg sm:text-xl">payments</span>
                            </div>
                            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white"><ConvertedAmount amount={parseFloat(stats.totalSpent)} originalCurrency="INR" /></p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 sm:p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                                <span className="text-white/80 text-xs sm:text-sm font-medium">{t('analytics.avgExpense')}</span>
                                <span className="material-symbols-outlined text-white text-lg sm:text-xl">avg_pace</span>
                            </div>
                            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white"><ConvertedAmount amount={parseFloat(stats.avgExpense)} originalCurrency="INR" /></p>
                        </div>

                        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-4 sm:p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                                <span className="text-white/80 text-xs sm:text-sm font-medium">{t('analytics.totalExpenses')}</span>
                                <span className="material-symbols-outlined text-white text-lg sm:text-xl">receipt_long</span>
                            </div>
                            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{stats.totalExpenses}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-4 sm:p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                                <span className="text-white/80 text-xs sm:text-sm font-medium">{t('analytics.topCategory')}</span>
                                <span className="material-symbols-outlined text-white text-lg sm:text-xl">category</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-white">{stats.topCategory}</p>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {/* Category Breakdown Pie Chart */}
                        <div className="bg-gradient-to-br from-white/20 to-white/10 dark:from-white/[0.04] dark:to-transparent backdrop-blur-[2px] shadow-md dark:shadow-none rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-white/10">
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
                                {t('analytics.spendByCategory')}
                            </h3>
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    className="hover:opacity-80 transition-opacity duration-300 cursor-pointer"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center text-gray-500">{t('analytics.noData')}</p>
                            )}
                        </div>

                        {/* Monthly Trend Line Chart */}
                        <div className="bg-gradient-to-br from-white/20 to-white/10 dark:from-white/[0.04] dark:to-transparent backdrop-blur-[2px] shadow-md dark:shadow-none rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-white/10">
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
                                {t('analytics.monthlyTrend')}
                            </h3>
                            {monthlyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorAmountLastMonth" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6B7280" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#6B7280" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            stroke="#9CA3AF"
                                            style={{ fontSize: '12px', fontWeight: 500 }}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="#9CA3AF"
                                            style={{ fontSize: '12px', fontWeight: 500 }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${currencySymbol}${value}`}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#F59E0B', strokeWidth: 1, strokeDasharray: '4 4', fill: 'transparent' }} />
                                        <Area
                                            type="monotone"
                                            dataKey="lastMonth"
                                            name={t('analytics.lastMonth')}
                                            stroke="#6B7280"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            fillOpacity={1}
                                            fill="url(#colorAmountLastMonth)"
                                            activeDot={false}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="currentMonth"
                                            name={t('analytics.thisMonth')}
                                            stroke="#F59E0B"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorAmount)"
                                            activeDot={{ r: 6, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center text-gray-500">{t('analytics.noData')}</p>
                            )}
                        </div>
                    </div>

                    {/* Secondary Insights Grid: Groups & Subscriptions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {/* Group Spending Breakdown */}
                        <div className="bg-gradient-to-br from-white/20 to-white/10 dark:from-white/[0.04] dark:to-transparent backdrop-blur-[2px] shadow-md dark:shadow-none rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-white/10">
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
                                {t('analytics.spendByGroup')}
                            </h3>
                            {groupSpendData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={groupSpendData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 500 }} width={100} stroke="#9CA3AF" />
                                        <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 border border-gray-800 dark:border-gray-200 rounded-xl p-3 shadow-xl">
                                                        <p className="text-sm font-bold mb-1">{payload[0].payload.name}</p>
                                                        <p className="text-sm text-green-400 dark:text-green-600 font-black">{currencySymbol}{payload[0].value}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }} />
                                        <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]}>
                                            {groupSpendData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} className="hover:opacity-80 transition-opacity cursor-pointer" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center text-gray-500 pt-8">{t('analytics.noGroupExpenses')}</p>
                            )}
                        </div>

                        {/* Recurring Subscriptions */}
                        <div className="bg-gradient-to-br from-white/20 to-white/10 dark:from-white/[0.04] dark:to-transparent backdrop-blur-[2px] shadow-md dark:shadow-none rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-white/10">
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-purple-500">autorenew</span>
                                {t('analytics.activeSubscriptions')}
                            </h3>
                            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                                {recurringExpenses.length > 0 ? (
                                    recurringExpenses.map(sub => (
                                        <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-[#1a1c23]/50 border border-gray-200 dark:border-white/10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                                    <span className="material-symbols-outlined text-sm">{sub.frequency === 'monthly' ? 'calendar_month' : 'event'}</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{sub.description}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{sub.category} • {sub.frequency}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm text-gray-900 dark:text-white">{currencySymbol}{parseFloat(sub.amount).toFixed(2)}</p>
                                                <p className="text-xs text-gray-500">{t('analytics.next')} {new Date(sub.nextCreationDate || sub.startDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 pt-8">{t('analytics.noSubscriptions')}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Spending Heatmap */}
                    <SpendingHeatmap expenses={expenses} currentUser={currentUser} />

                    {/* Category Details Table */}
                    <div className="bg-gradient-to-br from-white/20 to-white/10 dark:from-white/[0.04] dark:to-transparent backdrop-blur-[2px] shadow-md dark:shadow-none rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-white/10 flex-1 overflow-hidden">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {t('analytics.categoryBreakdown')}
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-white/10">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('analytics.category')}</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('analytics.amount')}</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('analytics.percentage')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categoryData.map((cat, idx) => {
                                        const totalCategorySpend = categoryData.reduce((sum, c) => sum + c.value, 0);
                                        const percentage = totalCategorySpend > 0 ? ((cat.value / totalCategorySpend) * 100).toFixed(1) : '0.0';
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
            {isEditingBudget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up">
                        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">crisis_alert</span>
                                {t('analytics.setTotalBudget')}
                            </h3>
                            <button
                                onClick={() => setIsEditingBudget(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                {t('analytics.setBudgetDesc')}
                            </p>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('analytics.monthlyBudgetLabel')}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-gray-500 dark:text-gray-400 font-bold">{currencySymbol}</span>
                                </div>
                                <input
                                    type="number"
                                    value={budgetInput}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || Number(val) >= 0) {
                                            setBudgetInput(val);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (['-', '+', 'e', 'E'].includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                    placeholder={t('analytics.budgetPlaceholder')}
                                    min="0"
                                    step="any"
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex gap-3 justify-end">
                            <button
                                onClick={() => setIsEditingBudget(false)}
                                className="px-5 py-2.5 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                            >
                                {t('analytics.cancel')}
                            </button>
                            <button
                                onClick={async () => {
                                    setIsSavingBudget(true);
                                    try {
                                        const newDisplayedBudget = Number(budgetInput);
                                        if (newDisplayedBudget > 0) {
                                            // Reverse engineer the base INR budget by dividing by the conversion rate of 1 INR
                                            const activeRateForOneINR = convertAmount(1, 'INR');
                                            const baseBudgetINR = Math.round(newDisplayedBudget / activeRateForOneINR);

                                            await updateUserDocument(currentUser.uid, { monthlyBudget: baseBudgetINR });
                                            setMonthlyBudget(baseBudgetINR);
                                        }
                                        setIsEditingBudget(false);
                                    } catch (err) {
                                        console.error('Failed to update budget', err);
                                    }
                                    setIsSavingBudget(false);
                                }}
                                disabled={isSavingBudget}
                                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                            >
                                {isSavingBudget ? t('analytics.saving') : t('analytics.saveChanges')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsPage;
