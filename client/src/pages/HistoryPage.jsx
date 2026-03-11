import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';
import { getUserExpenses, listenToUserSettlements } from '../firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext';

const HistoryPage = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const { formatAmount, currentCurrency, convertAmount } = useCurrency();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch expenses
                const expensesData = await getUserExpenses(currentUser.uid);

                // Fetch settlements
                const settlementsPromise = new Promise((resolve) => {
                    const unsubscribe = listenToUserSettlements(currentUser.uid, (settlementsData) => {
                        resolve(settlementsData);
                        unsubscribe();
                    });
                });

                const settlementsData = await settlementsPromise;

                // Combine and format activities
                const allActivities = [
                    ...expensesData.map(expense => ({
                        id: expense.id,
                        type: 'expense',
                        title: expense.description,
                        description: `${expense.paidByName} paid ${formatAmount(expense.amount, expense.currency || 'INR')}`,
                        group: expense.groupName || t('history.activities.noGroup'),
                        amount: expense.amount,
                        currency: expense.currency || 'INR',
                        timestamp: expense.createdAt,
                        icon: 'receipt_long',
                        color: 'orange',
                        isSettled: expense.isSettled || false
                    })),
                    ...settlementsData.map(settlement => ({
                        id: settlement.id,
                        type: 'settlement',
                        title: settlement.fromUserId === currentUser.uid
                            ? t('history.activities.paymentTo', { name: settlement.toUserName })
                            : t('history.activities.paymentFrom', { name: settlement.fromUserName }),
                        description: settlement.status === 'approved' ? t('history.activities.approved') : t('history.activities.pendingApproval'),
                        amount: settlement.amount,
                        timestamp: settlement.createdAt,
                        icon: 'payments',
                        color: settlement.status === 'approved' ? 'green' : 'yellow',
                        status: settlement.status
                    }))
                ];

                // Sort by timestamp (newest first)
                allActivities.sort((a, b) => {
                    const timeA = a.timestamp?.toDate?.() || new Date(0);
                    const timeB = b.timestamp?.toDate?.() || new Date(0);
                    return timeB - timeA;
                });

                setActivities(allActivities);
            } catch (error) {
                console.error('Error fetching activities:', error);
                addToast(t('history.activities.loadFail'), 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser, addToast]);

    const handleExport = () => {
        if (filteredActivities.length === 0) {
            addToast(t('history.csv.noActivities'), 'warning');
            return;
        }

        try {
            // Create CSV header
            const headers = [
                t('history.csv.headers.date'),
                t('history.csv.headers.type'),
                t('history.csv.headers.description'),
                t('history.csv.headers.group'),
                t('history.csv.headers.amount', { currency: currentCurrency }),
                t('history.csv.headers.status')
            ];

            // Create CSV rows
            const rows = filteredActivities.map(activity => {
                const date = activity.timestamp?.toDate?.()?.toLocaleDateString() || t('history.csv.noDate');
                const type = activity.type === 'expense' ? t('history.csv.expense') : t('history.csv.settlement');
                const description = activity.title;
                const group = activity.group || t('history.csv.na');

                // Convert amount for CSV if needed (using current display amount)
                const displayAmount = convertAmount(activity.amount, activity.currency || 'INR').toFixed(2);

                // Correct status logic
                let status;
                if (activity.type === 'expense') {
                    // For expenses, check if settled
                    status = activity.isSettled ? t('history.csv.settled') : t('history.csv.unsettled');
                } else {
                    // For settlements, show approval status
                    status = activity.status === 'approved' ? t('history.csv.approved') : t('history.csv.pending');
                }

                return [date, type, description, group, displayAmount, status];
            });

            // Combine headers and rows
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `gosplit-history-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            addToast(t('history.csv.exportSuccess', { count: filteredActivities.length }), 'success');
        } catch (error) {
            console.error('Export failed:', error);
            addToast(t('history.csv.exportFail'), 'error');
        }
    };

    // Filter activities
    const filteredActivities = activities.filter(activity => {
        // Filter by type
        if (activeFilter === 'expenses' && activity.type !== 'expense') return false;
        if (activeFilter === 'settlements' && activity.type !== 'settlement') return false;

        // Filter by search
        if (searchQuery) {
            const search = searchQuery.toLowerCase();
            return activity.title.toLowerCase().includes(search) ||
                activity.description.toLowerCase().includes(search) ||
                (activity.group && activity.group.toLowerCase().includes(search));
        }

        return true;
    });

    // Group by date
    const groupedActivities = filteredActivities.reduce((groups, activity) => {
        const date = activity.timestamp?.toDate?.() || new Date();
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let key;
        if (date.toDateString() === today.toDateString()) {
            key = t('history.time.today');
        } else if (date.toDateString() === yesterday.toDateString()) {
            key = t('history.time.yesterday');
        } else {
            key = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }

        if (!groups[key]) groups[key] = [];
        groups[key].push(activity);
        return groups;
    }, {});

    const getTimeAgo = (timestamp) => {
        if (!timestamp?.toDate) return t('history.time.unknown');

        const now = new Date();
        const past = timestamp.toDate();
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return t('history.time.justNow');
        if (diffMins < 60) return t('history.time.minsAgo', { count: diffMins });
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return t('history.time.hoursAgo', { count: diffHours });
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return t('history.time.daysAgo', { count: diffDays });
        return past.toLocaleDateString();
    };

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-7xl mx-auto">
            {/* Page Heading & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tight text-[#0d191b] dark:text-white">{t('history.title')}</h1>
                    <p className="text-[#5c6f73] dark:text-gray-400 text-base">{t('history.subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-amber-400 text-black text-sm font-bold shadow-md shadow-amber-900/20 hover:bg-amber-300 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        <span>{t('history.exportCSV')}</span>
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4">
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <span className="material-symbols-outlined">search</span>
                    </div>
                    <input
                        className="block w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 py-3 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent text-[#0d191b] dark:text-white backdrop-blur-md transition-all"
                        placeholder={t('history.searchPlaceholder')}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['all', 'expenses', 'settlements'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`group flex h-8 items-center gap-x-2 rounded-full px-4 text-sm font-medium transition-all ${activeFilter === filter
                                ? 'bg-amber-400 text-black'
                                : 'bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 hover:border-amber-400/50 text-[#0d191b] dark:text-white'
                                }`}
                        >
                            {t(`history.filters.${filter}`, { defaultValue: filter === 'all' ? 'All Types' : filter.charAt(0).toUpperCase() + filter.slice(1) })}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div className="flex flex-col gap-8 mt-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <span className="material-symbols-outlined text-6xl animate-spin mb-4">refresh</span>
                        <p>{t('history.loading')}</p>
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <span className="material-symbols-outlined text-6xl mb-4">history</span>
                        <p className="text-lg font-semibold">{t('history.noActivity')}</p>
                        <p className="text-sm">{t('history.noActivityDesc')}</p>
                    </div>
                ) : (
                    Object.entries(groupedActivities).map(([dateLabel, items]) => (
                        <div key={dateLabel} className="flex flex-col gap-4">
                            <h3 className="text-lg font-bold px-1 text-[#0d191b] dark:text-white">{dateLabel}</h3>

                            {items.map(activity => (
                                <div
                                    key={activity.id}
                                    className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent hover:border-amber-400/30 shadow-sm hover:shadow-md transition-all cursor-pointer backdrop-blur-md"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="relative shrink-0">
                                            <div className={`size-12 rounded-full bg-${activity.color}-500/10 flex items-center justify-center text-${activity.color}-400`}>
                                                <span className="material-symbols-outlined">{activity.icon}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-base font-bold text-[#0d191b] dark:text-white">{activity.title}</p>
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <span>{activity.description}</span>
                                                {activity.group && (
                                                    <>
                                                        <span className="size-1 bg-gray-600 rounded-full"></span>
                                                        <span className="font-medium text-gray-300">{activity.group}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-row sm:flex-col justify-between sm:items-end sm:text-right pl-[4rem] sm:pl-0">
                                        <span className={`text-sm font-bold ${activity.type === 'expense' ? 'text-orange-400' :
                                            activity.status === 'approved' ? 'text-green-400' : 'text-yellow-400'
                                            }`}>
                                            {formatAmount(activity.amount, activity.currency || 'INR')}
                                        </span>
                                        <span className="text-xs text-gray-500">{getTimeAgo(activity.timestamp)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
