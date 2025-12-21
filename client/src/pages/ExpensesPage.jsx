import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';

const ExpensesPage = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');

    const handleAddExpense = () => {
        addToast('Add expense feature coming soon!', 'info');
    };

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-7xl mx-auto">
            {/* Page Heading & Balance */}
            <div className="bg-white/5 p-6 rounded-xl shadow-sm border border-white/10 backdrop-blur-md">
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Expenses</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-medium">Total balance:</span>
                            <span className="text-amber-400 font-bold text-lg bg-amber-400/10 px-2 py-0.5 rounded">+$120.50</span>
                            <span className="text-gray-400 text-sm">(You are owed)</span>
                        </div>
                    </div>
                    <button
                        onClick={handleAddExpense}
                        className="bg-amber-400 hover:bg-amber-300 text-black h-12 rounded-lg text-sm font-bold flex items-center gap-2 px-6 shadow-lg shadow-amber-900/20 transition-all"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[240px]">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined">search</span>
                    <input
                        className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all placeholder:text-gray-400 text-sm font-medium text-white backdrop-blur-md"
                        placeholder="Search expenses..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    <button className="flex items-center gap-2 h-12 px-4 bg-white/5 border border-white/10 rounded-lg hover:border-amber-400/50 whitespace-nowrap transition-colors group backdrop-blur-md">
                        <span className="text-sm font-medium group-hover:text-amber-400 transition-colors text-white">All Groups</span>
                        <span className="material-symbols-outlined text-[18px] text-gray-400">expand_more</span>
                    </button>
                    <button className="flex items-center gap-2 h-12 px-4 bg-amber-400/10 border border-amber-400/20 rounded-lg whitespace-nowrap transition-colors backdrop-blur-md">
                        <span className="text-sm font-bold text-amber-400">This Month</span>
                        <span className="material-symbols-outlined text-[18px] text-amber-400">expand_more</span>
                    </button>
                    <button className="flex items-center gap-2 h-12 px-4 bg-white/5 border border-white/10 rounded-lg hover:border-amber-400/50 whitespace-nowrap transition-colors group backdrop-blur-md">
                        <span className="text-sm font-medium group-hover:text-amber-400 transition-colors text-white">Status: All</span>
                        <span className="material-symbols-outlined text-[18px] text-gray-400">expand_more</span>
                    </button>
                </div>
            </div>

            {/* Expense List */}
            <div className="flex flex-col gap-6">
                {/* Date Group: Yesterday */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider pl-1">Yesterday, Oct 24</h3>

                    {/* Expense Item 1 */}
                    <div className="group flex flex-col sm:flex-row gap-4 bg-white/5 p-4 rounded-xl shadow-sm border border-transparent hover:border-amber-400/20 transition-all cursor-pointer backdrop-blur-md">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="shrink-0 size-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <span className="material-symbols-outlined">shopping_cart</span>
                            </div>
                            <div className="flex flex-col justify-center gap-0.5">
                                <p className="text-base font-bold text-white">Groceries - Whole Foods</p>
                                <p className="text-sm text-gray-400">You paid $85.00</p>
                            </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 pl-16 sm:pl-0">
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">You lent</span>
                            <span className="text-base font-bold text-amber-400">$42.50</span>
                        </div>
                    </div>

                    {/* Expense Item 2 */}
                    <div className="group flex flex-col sm:flex-row gap-4 bg-white/5 p-4 rounded-xl shadow-sm border border-transparent hover:border-amber-400/20 transition-all cursor-pointer backdrop-blur-md">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="shrink-0 size-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
                                <span className="material-symbols-outlined">local_taxi</span>
                            </div>
                            <div className="flex flex-col justify-center gap-0.5">
                                <p className="text-base font-bold text-white">Uber to Airport</p>
                                <p className="text-sm text-gray-400">Mark paid $30.00</p>
                            </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 pl-16 sm:pl-0">
                            <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">You borrowed</span>
                            <span className="text-base font-bold text-orange-400">$15.00</span>
                        </div>
                    </div>
                </div>

                {/* Date Group: Oct 20 */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider pl-1">Oct 20</h3>

                    {/* Expense Item 3 */}
                    <div className="group flex flex-col sm:flex-row gap-4 bg-white/5 p-4 rounded-xl shadow-sm border border-transparent hover:border-amber-400/20 transition-all cursor-pointer backdrop-blur-md">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="shrink-0 size-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <span className="material-symbols-outlined">restaurant</span>
                            </div>
                            <div className="flex flex-col justify-center gap-0.5">
                                <p className="text-base font-bold text-white">Dinner at Mario's</p>
                                <p className="text-sm text-gray-400">You paid $120.00</p>
                            </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 pl-16 sm:pl-0">
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">You lent</span>
                            <span className="text-base font-bold text-amber-400">$60.00</span>
                        </div>
                    </div>

                    {/* Expense Item 4 (Settled) */}
                    <div className="group flex flex-col sm:flex-row gap-4 bg-white/5 p-4 rounded-xl shadow-sm border border-transparent hover:border-amber-400/20 transition-all cursor-pointer opacity-75 hover:opacity-100 backdrop-blur-md">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="shrink-0 size-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-500">
                                <span className="material-symbols-outlined">receipt_long</span>
                            </div>
                            <div className="flex flex-col justify-center gap-0.5">
                                <p className="text-base font-bold text-white line-through decoration-gray-400">Monthly Internet</p>
                                <p className="text-sm text-gray-400">Alice paid $50.00</p>
                            </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 pl-16 sm:pl-0">
                            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-500">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                Settled
                            </span>
                        </div>
                    </div>
                </div>

                {/* Load More */}
                <div className="flex justify-center pt-4">
                    <button className="text-gray-400 hover:text-amber-400 text-sm font-bold transition-colors">
                        Show earlier expenses
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExpensesPage;
