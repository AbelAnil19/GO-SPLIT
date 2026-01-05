import React, { useState } from 'react';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';

const HistoryPage = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    const handleExport = () => {
        addToast('Exporting activity history...', 'info');
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
                    <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm font-bold hover:bg-white/10 transition-colors text-[#0d191b] dark:text-white backdrop-blur-md">
                        <span className="material-symbols-outlined text-[20px]">filter_list</span>
                        <span className="hidden sm:inline">Filter</span>
                    </button>
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
                        className="block w-full rounded-xl border-none bg-white/5 py-3 pl-10 pr-4 text-sm shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-amber-400 sm:leading-6 text-[#0d191b] dark:text-white backdrop-blur-md"
                        placeholder="Search by description, person, or group"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`group flex h-8 items-center gap-x-2 rounded-full px-4 text-sm font-medium transition-all ${activeFilter === 'all' ? 'bg-amber-400 text-black' : 'bg-white/5 border border-white/10 hover:border-amber-400/50 text-white'
                            }`}
                    >
                        All Types
                    </button>
                    <button
                        onClick={() => setActiveFilter('expenses')}
                        className={`group flex h-8 items-center gap-x-2 rounded-full px-4 text-sm font-medium transition-all ${activeFilter === 'expenses' ? 'bg-amber-400 text-black' : 'bg-white/5 border border-white/10 hover:border-amber-400/50 text-white'
                            }`}
                    >
                        Expenses
                    </button>
                    <button
                        onClick={() => setActiveFilter('settlements')}
                        className={`group flex h-8 items-center gap-x-2 rounded-full px-4 text-sm font-medium transition-all ${activeFilter === 'settlements' ? 'bg-amber-400 text-black' : 'bg-white/5 border border-white/10 hover:border-amber-400/50 text-white'
                            }`}
                    >
                        Settlements
                    </button>
                    <button
                        onClick={() => setActiveFilter('groups')}
                        className={`group flex h-8 items-center gap-x-2 rounded-full px-4 text-sm font-medium transition-all ${activeFilter === 'groups' ? 'bg-amber-400 text-black' : 'bg-white/5 border border-white/10 hover:border-amber-400/50 text-white'
                            }`}
                    >
                        Group Updates
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div className="flex flex-col gap-8 mt-4">
                {/* Today */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold px-1 text-[#0d191b] dark:text-white">Today</h3>

                    {/* Activity Card 1: Expense */}
                    <div className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent hover:border-amber-400/30 shadow-sm hover:shadow-md transition-all cursor-pointer backdrop-blur-md">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative shrink-0">
                                <div className="size-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
                                    <span className="material-symbols-outlined">receipt_long</span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-[#0f172a] p-0.5">
                                    <div className="size-full rounded-full bg-gray-700"></div>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-base font-bold text-[#0d191b] dark:text-white">Sushi Dinner</p>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span>Alice paid $84.00</span>
                                    <span className="size-1 bg-gray-600 rounded-full"></span>
                                    <span className="font-medium text-gray-300">Roommates 🏠</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-row sm:flex-col justify-between sm:items-end sm:text-right pl-[4rem] sm:pl-0">
                            <span className="text-sm text-orange-400 font-bold">You owe $28.00</span>
                            <span className="text-xs text-gray-500">2 hours ago</span>
                        </div>
                    </div>

                    {/* Activity Card 2: Settlement */}
                    <div className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent hover:border-amber-400/30 shadow-sm hover:shadow-md transition-all cursor-pointer backdrop-blur-md">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative shrink-0">
                                <div className="size-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                                    <span className="material-symbols-outlined">payments</span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-[#0f172a] p-0.5">
                                    <div className="size-full rounded-full bg-gray-700"></div>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-base font-bold text-[#0d191b] dark:text-white">Payment to John</p>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span>You paid John</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-row sm:flex-col justify-between sm:items-end sm:text-right pl-[4rem] sm:pl-0">
                            <span className="text-sm text-white font-bold">You paid $50.00</span>
                            <span className="text-xs text-gray-500">5 hours ago</span>
                        </div>
                    </div>

                    {/* Activity Card 3: Group Update */}
                    <div className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent hover:border-amber-400/30 shadow-sm hover:shadow-md transition-all cursor-pointer backdrop-blur-md">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative shrink-0">
                                <div className="size-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                                    <span className="material-symbols-outlined">group_add</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-base font-bold text-[#0d191b] dark:text-white">Group "Trip to Bali" Created</p>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span>Added by You</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-row sm:flex-col justify-between sm:items-end sm:text-right pl-[4rem] sm:pl-0">
                            <span className="text-sm text-gray-400 font-medium">No expense</span>
                            <span className="text-xs text-gray-500">8 hours ago</span>
                        </div>
                    </div>
                </div>

                {/* Load More */}
                <div className="flex justify-center mt-6">
                    <button className="text-sm font-bold text-gray-400 hover:text-amber-400 transition-colors py-2 px-4 rounded-lg hover:bg-white/5">
                        Load older activity
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;
