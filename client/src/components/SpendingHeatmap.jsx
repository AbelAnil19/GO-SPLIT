import React, { useState, useMemo } from 'react';
import { useCurrency } from '../context/CurrencyContext';

const SpendingHeatmap = ({ expenses, currentUser }) => {
    const { currencySymbol } = useCurrency();
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    // Generate last 12 months for selector
    const monthOptions = useMemo(() => {
        const options = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const yearStr = date.getFullYear();
            const monthStr = String(date.getMonth() + 1).padStart(2, '0');
            options.push({
                value: `${yearStr}-${monthStr}`,
                label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            });
        }
        return options;
    }, []);

    // Process data for the selected month
    const { days, maxAmount } = useMemo(() => {
        if (!expenses || !currentUser) return { days: [], maxAmount: 0 };

        const [year, month] = selectedMonth.split('-').map(Number);

        // Get number of days in the month
        const daysInMonth = new Date(year, month, 0).getDate();
        // Get day of week of the 1st (0 = Sun, 6 = Sat)
        const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

        // Initialize calendar grid with empty padding for first week
        const calendarDays = Array(firstDayOfWeek).fill(null);

        const dailyTotals = {};
        const dailyCounts = {};

        // Calculate user share helper
        const getUserShare = (expense) => {
            const userSplit = expense.splitBetween?.find(split => split.userId === currentUser.uid);
            return userSplit ? userSplit.amount : 0;
        };

        expenses.forEach(expense => {
            const expenseDate = expense.createdAt || expense.date;
            if (!expenseDate) return;

            // Safely parse Firestore Timestamp or string
            const date = expenseDate.toDate ? expenseDate.toDate() : new Date(expenseDate);

            if (date.getFullYear() === year && date.getMonth() === month - 1) {
                const day = date.getDate();
                const userShare = getUserShare(expense);
                if (userShare > 0) {
                    dailyTotals[day] = (dailyTotals[day] || 0) + userShare;
                    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
                }
            }
        });

        let currentMax = 0;

        for (let i = 1; i <= daysInMonth; i++) {
            const amount = dailyTotals[i] || 0;
            if (amount > currentMax) currentMax = amount;

            calendarDays.push({
                date: new Date(year, month - 1, i),
                amount,
                count: dailyCounts[i] || 0,
                dayNum: i
            });
        }

        return { days: calendarDays, maxAmount: currentMax };
    }, [expenses, selectedMonth, currentUser]);

    // Color logic
    const getSquareColor = (amount) => {
        if (amount === 0) return 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-300';
        if (maxAmount === 0) return 'bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-300';

        const ratio = amount / maxAmount;
        if (ratio <= 0.33) return 'bg-[#a7f3d0] dark:bg-[#065f46] border-[#6ee7b7] dark:border-[#047857] text-[#065f46] dark:text-[#a7f3d0]'; // Low
        if (ratio <= 0.66) return 'bg-[#34d399] dark:bg-[#10b981] border-[#10b981] dark:border-[#059669] text-[#064e3b] dark:text-white'; // Moderate
        return 'bg-[#059669] dark:bg-[#047857] border-[#047857] dark:border-[#064e3b] text-white'; // High
    };

    return (
        <div className="bg-gradient-to-br from-white/20 to-white/10 dark:from-white/[0.04] dark:to-transparent backdrop-blur-[2px] rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-white/10 shadow-md dark:shadow-none relative overflow-hidden group">

            {/* Topographic pattern background (matching existing dashboard style) */}
            <div className="absolute inset-0 opacity-5 dark:opacity-[0.02] pointer-events-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
            </div>

            <div className="relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-100 dark:bg-green-500/10 rounded-xl">
                            <span className="material-symbols-outlined text-green-600 dark:text-green-400">calendar_month</span>
                        </div>
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-tight">Spending Heatmap</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Daily expense intensity overview</p>
                        </div>
                    </div>

                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all shadow-sm text-sm font-medium cursor-pointer"
                    >
                        {monthOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="overflow-x-auto pb-6">
                    <div className="min-w-[300px] max-w-[600px] mx-auto">
                        {/* Days of week header */}
                        <div className="grid grid-cols-7 mb-2 gap-1.5 sm:gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                            {days.map((day, index) => {
                                if (day === null) {
                                    return <div key={`empty-${index}`} className="aspect-square rounded-lg" />;
                                }

                                return (
                                    <div
                                        key={`day-${index}`}
                                        className="relative group/tooltip aspect-square"
                                    >
                                        <div className={`w-full h-full rounded-lg border transition-all duration-300 flex items-center justify-center text-xs sm:text-sm font-semibold shadow-sm hover:scale-110 hover:shadow-md cursor-crosshair hover:z-10 ${getSquareColor(day.amount)}`}>
                                            <span className="drop-shadow-sm">{day.dayNum}</span>
                                        </div>

                                        {/* Tooltip - flips below for first row to avoid clipping */}
                                        {index < 7 ? (
                                            <div className="absolute opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity duration-200 top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-max">
                                                <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-xl py-2.5 px-3.5 shadow-xl flex flex-col gap-1 items-center border border-gray-800 dark:border-gray-200">
                                                    {/* Tooltip pointer (above) */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-1px] border-[5px] border-transparent border-b-gray-900 dark:border-b-white"></div>
                                                    <span className="font-bold opacity-90">
                                                        {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </span>
                                                    {day.amount > 0 ? (
                                                        <>
                                                            <span className="font-black text-sm text-green-400 dark:text-green-600 mt-0.5">
                                                                {currencySymbol}{day.amount.toFixed(2)}
                                                            </span>
                                                            <span className="opacity-75">{day.count} transaction{day.count !== 1 ? 's' : ''}</span>
                                                        </>
                                                    ) : (
                                                        <span className="opacity-75 mt-0.5">No spending</span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="absolute opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-max">
                                                <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-xl py-2.5 px-3.5 shadow-xl flex flex-col gap-1 items-center border border-gray-800 dark:border-gray-200">
                                                    <span className="font-bold opacity-90">
                                                        {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </span>
                                                    {day.amount > 0 ? (
                                                        <>
                                                            <span className="font-black text-sm text-green-400 dark:text-green-600 mt-0.5">
                                                                {currencySymbol}{day.amount.toFixed(2)}
                                                            </span>
                                                            <span className="opacity-75">{day.count} transaction{day.count !== 1 ? 's' : ''}</span>
                                                        </>
                                                    ) : (
                                                        <span className="opacity-75 mt-0.5">No spending</span>
                                                    )}
                                                    {/* Tooltip pointer */}
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[5px] border-transparent border-t-gray-900 dark:border-t-white"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-3 mt-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    <span>Low</span>
                    <div className="flex gap-1.5">
                        <div className="w-4 h-4 rounded-md bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10" title="0 spending"></div>
                        <div className="w-4 h-4 rounded-md bg-[#a7f3d0] dark:bg-[#065f46] border border-[#6ee7b7] dark:border-[#047857]" title="Low spending"></div>
                        <div className="w-4 h-4 rounded-md bg-[#34d399] dark:bg-[#10b981] border border-[#10b981] dark:border-[#059669]" title="Moderate spending"></div>
                        <div className="w-4 h-4 rounded-md bg-[#059669] dark:bg-[#047857] border border-[#047857] dark:border-[#064e3b]" title="High spending"></div>
                    </div>
                    <span>High</span>
                </div>
            </div>
        </div>
    );
};

export default SpendingHeatmap;
