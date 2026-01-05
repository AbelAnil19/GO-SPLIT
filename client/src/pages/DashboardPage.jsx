import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../firebase/authContext';
import { createGroup, getUserGroups, listenToUserGroups } from '../firebase/firestore';

const StatCard = ({ icon, label, value, trend, trendLabel, trendUp, color }) => (
    <div className={`p-6 rounded-3xl bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/10 backdrop-blur-md relative overflow-hidden group hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-soft`}>
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity bg-${color}-500`}></div>
        <div className="flex items-center gap-3 relative z-10 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-500/10 text-${color}-400`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <span className="text-[#5c6f73] dark:text-gray-400 text-sm font-medium">{label}</span>
        </div>
        <div className="relative z-10">
            <h3 className="text-3xl font-bold text-[#0d191b] dark:text-white mb-2">{value}</h3>
            <div className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
                <span className="material-symbols-outlined text-sm">{trendUp ? 'trending_up' : 'trending_down'}</span>
                <span>{trend} {trendLabel}</span>
            </div>
        </div>
    </div>
);

const GroupCard = ({ name, lastActive, settled, oweAmount, onOpen }) => (
    <div
        onClick={onOpen}
        className="p-5 rounded-2xl bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/10 hover:border-amber-400/30 transition-all cursor-pointer group shadow-soft"
    >
        <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/10 to-orange-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">flight</span>
            </div>
            {settled ? (
                <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-lg text-xs font-bold border border-green-500/20">Settled</span>
            ) : (
                <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold border border-red-500/20">You owe ${oweAmount}</span>
            )}
        </div>
        <h3 className="font-bold text-lg text-[#0d191b] dark:text-white mb-1 group-hover:text-amber-500 transition-colors">{name}</h3>
        <p className="text-xs text-[#5c6f73] dark:text-gray-500 mb-4">Last activity: {lastActive}</p>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200 dark:border-white/5">
            <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-[#1a1a1a] flex items-center justify-center text-xs text-[#5c6f73] dark:text-gray-400">
                        {i}
                    </div>
                ))}
            </div>
            <button className="text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors">View Ledger</button>
        </div>
    </div>
);

const CreateGroupModal = ({ isOpen, onClose, onCreate }) => {
    const [groupName, setGroupName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate(groupName);
        setGroupName('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-[#1a1c23] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                <h2 className="text-xl font-bold text-white mb-4">Create New Group</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm font-bold mb-2">Group Name</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors"
                            placeholder="e.g. Summer Trip"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 font-bold hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-amber-400 text-black font-bold rounded-xl hover:bg-amber-300 transition-colors"
                        >
                            Create Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DashboardPage = () => {
    const { addToast } = useToast();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    // Get user's first name
    const userFirstName = currentUser?.displayName?.split(' ')[0] || 'You';

    // Fetch user's groups with real-time listener
    useEffect(() => {
        if (!currentUser) return;

        setLoading(true);
        const unsubscribe = listenToUserGroups(currentUser.uid, (groupsData) => {
            setGroups(groupsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleSettleUp = (name, amount) => {
        addToast(`Payment of ${amount} to ${name} processed!`, 'success');
    };

    const handleRemind = (name) => {
        addToast(`Reminder sent to ${name}!`, 'info');
    };

    const handleCreateGroup = async (name) => {
        try {
            await createGroup(name, currentUser.uid, {
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL
            });
            addToast(`Group "${name}" created successfully!`, 'success');
            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Error creating group:', error);
            addToast('Failed to create group. Please try again.', 'error');
        }
    };

    const handleViewLedger = (groupName) => {
        navigate('/dashboard/groups');
        addToast(`Navigating to ${groupName} ledger...`, 'info');
    };

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Quick Stats Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon="payments"
                    label="Expenses (Month)"
                    value="$1,240.50"
                    trend="12%"
                    trendLabel="less than last month"
                    trendUp={true}
                    color="amber"
                />
                <StatCard
                    icon="call_made"
                    label="You Owe"
                    value="$120.00"
                    trend="2"
                    trendLabel="friends pending"
                    trendUp={false}
                    color="red"
                />
                <StatCard
                    icon="call_received"
                    label="You Are Owed"
                    value="$45.00"
                    trend="1"
                    trendLabel="group pending"
                    trendUp={true}
                    color="green"
                />
                <StatCard
                    icon="groups"
                    label="Active Groups"
                    value="3"
                    trend="2h"
                    trendLabel="ago last active"
                    trendUp={true}
                    color="blue"
                />
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column (Groups & Settlements) */}
                <div className="xl:col-span-2 flex flex-col gap-8">
                    {/* Settlements Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[#0d191b] dark:text-white">Pending Settlements</h2>
                            <Link to="/dashboard/expenses" className="text-amber-400 text-sm font-semibold hover:text-amber-300">View all</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-white/5 p-5 rounded-2xl border-2 border-gray-300 dark:border-white/10 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                    <div>
                                        <p className="font-bold text-[#0d191b] dark:text-white text-sm">Sarah Jenkins</p>
                                        <p className="text-xs text-[#5c6f73] dark:text-gray-400">owe for "Lunch"</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-red-500 mb-1">-$25.00</p>
                                    <button
                                        onClick={() => handleSettleUp('Sarah Jenkins', '$25.00')}
                                        className="text-xs font-bold bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full hover:bg-red-500/20 transition-colors"
                                    >
                                        Settle Up
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-white/5 p-5 rounded-2xl border-2 border-gray-300 dark:border-white/10 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                    <div>
                                        <p className="font-bold text-[#0d191b] dark:text-white text-sm">Mike Ross</p>
                                        <p className="text-xs text-[#5c6f73] dark:text-gray-400">owes you for "Uber"</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-500 mb-1">+$15.00</p>
                                    <button
                                        onClick={() => handleRemind('Mike Ross')}
                                        className="text-xs font-bold bg-white/10 text-gray-300 px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors"
                                    >
                                        Remind
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Your Groups Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[#0d191b] dark:text-white">Your Groups</h2>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 bg-amber-400 text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-300 transition-colors shadow-lg shadow-amber-900/20"
                            >
                                <span className="material-symbols-outlined text-xl">add</span>
                                Create Group
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Loading State */}
                            {loading && (
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2 min-h-[140px] col-span-2">
                                    <span className="material-symbols-outlined text-4xl text-amber-400 animate-spin">refresh</span>
                                    <p className="text-white/60">Loading groups...</p>
                                </div>
                            )}

                            {/* No Groups State */}
                            {!loading && groups.length === 0 && (
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2 min-h-[140px] col-span-2">
                                    <span className="material-symbols-outlined text-4xl text-white/40">group_off</span>
                                    <p className="text-white/60">No groups yet. Create one to get started!</p>
                                </div>
                            )}

                            {/* Real Groups from Firestore */}
                            {!loading && groups.slice(0, 4).map((group) => (
                                <GroupCard
                                    key={group.id}
                                    name={group.name}
                                    lastActive="Active"
                                    settled={group.isSettled || false}
                                    onOpen={() => navigate('/dashboard/groups')}
                                />
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column (Activity Feed) */}
                <aside className="bg-white dark:bg-white/5 p-6 rounded-3xl border-2 border-gray-300 dark:border-white/10 h-full backdrop-blur-sm">
                    <h2 className="text-lg font-bold text-[#0d191b] dark:text-white mb-6">Recent Activity</h2>
                    <div className="relative pl-4 border-l border-gray-200 dark:border-white/10 space-y-8">
                        {[
                            { user: 'Sarah', action: 'added "Utility Bill"', target: 'Apt 4B Roomies', time: '2 mins ago', color: 'blue' },
                            { user: userFirstName, action: 'settled $15.00 with', target: 'Mike', time: '1 hour ago', color: 'green' },
                            { user: 'John', action: 'commented on "Grocery Run"', time: '3 hours ago', color: 'gray' },
                        ].map((item, index) => (
                            <div key={index} className="relative">
                                <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-${item.color}-500 ring-4 ring-[#0f172a]`}></div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-[#5c6f73] dark:text-gray-300 leading-relaxed">
                                        <span className="font-bold text-[#0d191b] dark:text-white">{item.user}</span> {item.action} {item.target && <span className="font-semibold text-amber-500">{item.target}</span>}.
                                    </p>
                                    <span className="text-xs text-[#5c6f73] dark:text-gray-400">{item.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/dashboard/history" className="block w-full text-center mt-8 py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors border border-white/10 rounded-xl hover:bg-white/5 hover:border-white/20">
                        View Full History
                    </Link>

                    {/* Pro Upgrade Card */}
                    <div className="mt-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:opacity-20 transition-opacity"></div>
                        <h3 className="font-bold text-lg mb-2 relative z-10">Go Pro!</h3>
                        <p className="text-sm opacity-90 mb-4 relative z-10 text-indigo-100">Scan receipts automatically and export reports.</p>
                        <button
                            onClick={() => addToast('Premium features coming soon!', 'info')}
                            className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition relative z-10 shadow-lg"
                        >
                            Upgrade Now
                        </button>
                    </div>
                </aside>
            </div>

            {/* Floating Action Button (Mobile) */}
            <div className="fixed bottom-6 right-6 lg:hidden z-50">
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center w-14 h-14 bg-amber-400 text-black rounded-full shadow-lg shadow-amber-500/30 hover:bg-amber-300 hover:scale-110 transition-all"
                >
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            </div>

            {/* Modals */}
            <CreateGroupModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateGroup}
            />
        </div>
    );
};

export default DashboardPage;
