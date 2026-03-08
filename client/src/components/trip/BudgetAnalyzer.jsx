import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';

const BudgetAnalyzer = ({ totalBudget, utilized, avgDaily, estimatedFinal, dailySpending = [], startDate, endDate }) => {
    const { t } = useTranslation();
    const { formatAmount } = useCurrency();
    const utilizationPercent = Math.round((utilized / totalBudget) * 100);

    // Generate chart points from real data
    const generateChartPoints = () => {
        if (dailySpending.length === 0) {
            // Fallback to placeholder if no data
            return [
                { x: 5, y: 60 },
                { x: 20, y: 45 },
                { x: 35, y: 70 },
                { x: 50, y: 35 },
                { x: 65, y: 55 },
                { x: 80, y: 25 },
                { x: 95, y: 40 }
            ];
        }

        // Map daily spending to chart coordinates
        const maxSpending = Math.max(...dailySpending.map(d => d.amount), totalBudget);
        return dailySpending.map((day, index) => ({
            x: (index / (dailySpending.length - 1 || 1)) * 95 + 2.5, // Spread across 0-100
            y: 75 - (day.amount / maxSpending) * 60 // Invert Y (SVG coordinates) and scale to 0-75
        }));
    };

    const chartPoints = generateChartPoints();

    // Create SVG path
    const createPath = () => {
        if (chartPoints.length === 0) return '';

        let path = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
        for (let i = 1; i < chartPoints.length; i++) {
            const cp1x = (chartPoints[i - 1].x + chartPoints[i].x) / 2;
            const cp1y = chartPoints[i - 1].y;
            const cp2x = (chartPoints[i - 1].x + chartPoints[i].x) / 2;
            const cp2y = chartPoints[i].y;
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${chartPoints[i].x} ${chartPoints[i].y}`;
        }
        return path;
    };

    // Format date labels
    const getDateLabels = () => {
        if (!startDate || !endDate) {
            return ['MAY 1', 'MAY 10', 'MAY 20', 'MAY 31'];
        }

        const start = startDate?.toDate ? startDate.toDate() : new Date(startDate);
        const end = endDate?.toDate ? endDate.toDate() : new Date(endDate);

        const formatDate = (date) => {
            const lang = t('common.save') ? (document.documentElement.lang || 'en') : 'en'; // simple fallback if i18n not available directly 
            // Better yet, use i18n.language if we import i18n, but since we have `react-i18next`, we can use `i18n.language` by adding it from `useTranslation()`
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
        };

        // Generate 4 date points (start, 1/3, 2/3, end)
        const duration = end - start;
        return [
            formatDate(start),
            formatDate(new Date(start.getTime() + duration / 3)),
            formatDate(new Date(start.getTime() + (2 * duration) / 3)),
            formatDate(end)
        ];
    };

    const dateLabels = getDateLabels();

    return (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-1">{t('budgetAnalyzer.title')}</h3>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">
                            {t('budgetAnalyzer.liveInsights')}
                        </span>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">{t('budgetAnalyzer.budgetUtilization')}</p>
                    <p className="text-amber-600 dark:text-amber-400 font-bold text-2xl">{utilizationPercent}%</p>
                </div>
            </div>

            {/* Chart */}
            <div className="relative h-32 mb-6">
                {utilized > 0 && dailySpending?.length > 0 ? (
                    <>
                        <svg viewBox="0 0 100 80" className="w-full h-full">
                            <defs>
                                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
                                </linearGradient>
                            </defs>
                            <path
                                d={createPath()}
                                fill="none"
                                stroke="url(#lineGradient)"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>

                        {/* Date labels */}
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                            {dateLabels.map((label, index) => (
                                <span key={index}>{label}</span>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center border border-amber-500/10 rounded-xl bg-gradient-to-t from-amber-500/5 to-transparent relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none"></div>
                        <span className="material-symbols-outlined text-amber-500/40 text-4xl mb-2 drop-shadow-md">add_chart</span>
                        <p className="text-gray-400 dark:text-gray-500 text-sm font-semibold tracking-wide">{t('budgetAnalyzer.startBuilding')}</p>
                        <p className="text-xs text-gray-500/70 dark:text-gray-600 mt-1">{t('budgetAnalyzer.toUnlock')}</p>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">{t('budgetAnalyzer.avgDaily')}</p>
                    <p className="text-gray-900 dark:text-white font-bold text-lg">{formatAmount(avgDaily)}</p>
                </div>
                <div className="bg-white/5 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">{t('budgetAnalyzer.estFinal')}</p>
                    <p className="text-green-600 dark:text-green-400 font-bold text-lg">{formatAmount(estimatedFinal)}</p>
                </div>
            </div>

            {/* Footnote */}
            <p className="text-gray-500 text-xs mt-4 uppercase">
                {formatAmount(utilized)} {t('budgetAnalyzer.of')} {formatAmount(totalBudget)} {t('budgetAnalyzer.used')}
            </p>
        </div>
    );
};

export default BudgetAnalyzer;
