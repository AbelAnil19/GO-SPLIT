import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';
import { getUserExpenses, listenToUserSettlements } from '../firebase/firestore';

const HistoryPage = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
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
                        description: `${expense.paidByName} paid ${expense.currency || '₹'}${expense.amount}`,
                        group: expense.groupName || 'No Group',
                        amount: expense.amount,
                        timestamp: expense.createdAt,
                        icon: 'receipt_long',
                        color: 'orange',
                        isSettled: expense.isSettled || false
                    })),
                    ...settlementsData.map(settlement => ({
                        id: settlement.id,
                        type: 'settlement',
                        title: settlement.fromUserId === currentUser.uid
                            ? `Payment to ${settlement.toUserName}`
                            : `Payment from ${settlement.fromUserName}`,
                        description: settlement.status === 'approved' ? 'Approved' : 'Pending approval',
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
                addToast('Failed to load activity history', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser, addToast]);

    const handleExport = () => {
        if (filteredActivities.length === 0) {
            addToast('No activities to export', 'warning');
            return;
        }

        try {
            // Create CSV header
            const headers = ['Date', 'Type', 'Description', 'Group', 'Amount (₹)', 'Status'];

            // Create CSV rows
            const rows = filteredActivities.map(activity => {
                const date = activity.timestamp?.toDate?.()?.toLocaleDateString() || 'No Date';
                const type = activity.type === 'expense' ? 'Expense' : 'Settlement';
                const description = activity.title;
                const group = activity.group || 'N/A';
                const amount = activity.amount;

                // Correct status logic
                let status;
                if (activity.type === 'expense') {
                    // For expenses, check if settled
                    status = activity.isSettled ? 'Settled' : 'Unsettled';
                } else {
                    // For settlements, show approval status
                    status = activity.status === 'approved' ? 'Approved' : 'Pending';
                }

                return [date, type, description, group, amount, status];
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

            addToast(`Exported ${filteredActivities.length} activities`, 'success');
        } catch (error) {
            console.error('Export failed:', error);
            addToast('Failed to export CSV', 'error');
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
            key = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            key = 'Yesterday';
        } else {
            key = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }

        if (!groups[key]) groups[key] = [];
        groups[key].push(activity);
        return groups;
    }, {});

    const getTimeAgo = (timestamp) => {
        if (!timestamp?.toDate) return 'Unknown';

        const now = new Date();
        const past = timestamp.toDate();
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return past.toLocaleDateString();
    };

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-7xl mx-auto">
            {/* Page Heading & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tight text-[#0d191b] dark:text-white">Activity History</h1>
                    <p className="text-[#5c6f73] dark:text-gray-400 text-base">View your past expenses, settlements, and group updates.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-amber-400 text-black text-sm font-bold shadow-md shadow-amber-900/20 hover:bg-amber-300 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        <span>Export CSV</span>
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
                        placeholder="Search by description, person, or group"
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
                            {filter === 'all' ? 'All Types' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div className="flex flex-col gap-8 mt-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <span className="material-symbols-outlined text-6xl animate-spin mb-4">refresh</span>
                        <p>Loading activity history...</p>
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <span className="material-symbols-outlined text-6xl mb-4">history</span>
                        <p className="text-lg font-semibold">No activity found</p>
                        <p className="text-sm">Start adding expenses or making settlements!</p>
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
                                            ₹{activity.amount}
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
