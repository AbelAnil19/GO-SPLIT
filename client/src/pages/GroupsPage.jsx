import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';

const GroupsPage = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleCreateGroup = () => {
        setIsCreateModalOpen(true);
    };

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Page Heading & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Your Groups</h2>
                    <p className="text-gray-400">Manage your shared expenses and group balances</p>
                </div>
                <button
                    onClick={handleCreateGroup}
                    className="bg-amber-400 hover:bg-amber-300 text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-900/20 transition-all transform active:scale-95"
                >
                    <span className="material-symbols-outlined">add</span>
                    Create New Group
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 rounded-2xl p-6 bg-white/5 border border-white/10 shadow-sm backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-400 font-medium">Total you owe</p>
                        <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-1.5 rounded-lg">trending_down</span>
                    </div>
                    <p className="text-white text-3xl font-bold tracking-tight">$135.00</p>
                    <p className="text-red-400 text-sm font-medium mt-1">across 2 groups</p>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl p-6 bg-white/5 border border-white/10 shadow-sm backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-400 font-medium">Total owed to you</p>
                        <span className="material-symbols-outlined text-green-500 bg-green-500/10 p-1.5 rounded-lg">trending_up</span>
                    </div>
                    <p className="text-white text-3xl font-bold tracking-tight">$770.00</p>
                    <p className="text-green-400 text-sm font-medium mt-1">across 3 groups</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <input
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all backdrop-blur-md"
                        placeholder="Filter groups by name..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-gray-400">search</span>
                </div>
                <div className="flex gap-2">
                    <select className="h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer backdrop-blur-md">
                        <option>Sort by: Recent</option>
                        <option>Sort by: Name</option>
                        <option>Sort by: Balance</option>
                    </select>
                    <button className="h-12 w-12 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-amber-400 hover:border-amber-400/50 transition-colors backdrop-blur-md">
                        <span className="material-symbols-outlined">filter_list</span>
                    </button>
                </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Group Card 1: You owe */}
                <div className="group flex flex-col justify-between bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300 backdrop-blur-md">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="size-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                                <span className="material-symbols-outlined">apartment</span>
                            </div>
                            <button className="text-gray-400 hover:text-white">
                                <span className="material-symbols-outlined">more_horiz</span>
                            </button>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Apartment 4B</h3>
                        <p className="text-sm text-gray-400 mb-4">4 members</p>
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
                            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">You owe</p>
                            <p className="text-xl font-bold text-red-400">$120.00</p>
                        </div>
                    </div>
                    <div className="flex items-center -space-x-2 pt-2 border-t border-white/5">
                        <div className="size-8 rounded-full border-2 border-[#0f172a] bg-gray-700"></div>
                        <div className="size-8 rounded-full border-2 border-[#0f172a] bg-gray-700"></div>
                        <div className="size-8 rounded-full border-2 border-[#0f172a] bg-gray-700"></div>
                        <div className="size-8 rounded-full border-2 border-[#0f172a] bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                            +1
                        </div>
                    </div>
                </div>

                {/* Group Card 2: You are owed */}
                <div className="group flex flex-col justify-between bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300 backdrop-blur-md">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <span className="material-symbols-outlined">flight</span>
                            </div>
                            <button className="text-gray-400 hover:text-white">
                                <span className="material-symbols-outlined">more_horiz</span>
                            </button>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Hawaii Trip</h3>
                        <p className="text-sm text-gray-400 mb-4">6 members</p>
                        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-4">
                            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">You are owed</p>
                            <p className="text-xl font-bold text-green-400">$450.00</p>
                        </div>
                    </div>
                    <div className="flex items-center -space-x-2 pt-2 border-t border-white/5">
                        <div className="size-8 rounded-full border-2 border-[#0f172a] bg-gray-700"></div>
                        <div className="size-8 rounded-full border-2 border-[#0f172a] bg-gray-700"></div>
                        <div className="size-8 rounded-full border-2 border-[#0f172a] bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                            +4
                        </div>
                    </div>
                </div>

                {/* Group Card 3: Settled */}
                <div className="group flex flex-col justify-between bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300 backdrop-blur-md">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="size-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                <span className="material-symbols-outlined">restaurant</span>
                            </div>
                            <button className="text-gray-400 hover:text-white">
                                <span className="material-symbols-outlined">more_horiz</span>
                            </button>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Friday Night Dinner</h3>
                        <p className="text-sm text-gray-400 mb-4">3 members</p>
                        <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700 mb-4">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                            <p className="text-xl font-bold text-gray-300">Settled up</p>
                        </div>
                    </div>
                    <div className="flex items-center -space-x-2 pt-2 border-t border-white/5">
                        <div className="size-8 rounded-full border-2 border-[#0f172a] bg-gray-700"></div>
                        <div className="size-8 rounded-full border-2 border-[#0f172a] bg-gray-700"></div>
                        <div className="size-8 rounded-full border-2 border-[#0f172a] bg-gray-700"></div>
                    </div>
                </div>

                {/* Create New Group Card */}
                <button
                    onClick={handleCreateGroup}
                    className="group flex flex-col items-center justify-center gap-4 bg-transparent p-5 rounded-2xl border-2 border-dashed border-white/10 hover:border-amber-400/50 hover:bg-amber-400/5 transition-all duration-300 min-h-[250px] cursor-pointer backdrop-blur-md"
                >
                    <div className="size-16 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center shadow-sm transition-colors">
                        <span className="material-symbols-outlined text-amber-400 text-3xl">add</span>
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">Create New Group</h3>
                        <p className="text-sm text-gray-400 mt-1">Start sharing expenses</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default GroupsPage;
