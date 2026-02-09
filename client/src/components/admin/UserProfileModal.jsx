import React, { useState, useEffect } from 'react';
import { getUserStats, getUserGroupsAdmin, getUserRecentExpenses, banUser, unbanUser, updateUserRole } from '../../firebase/firestore';
import { useToast } from '../../context/ToastContext';

const UserProfileModal = ({ user, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [userStats, setUserStats] = useState(null);
    const [userGroups, setUserGroups] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        loadUserData();
    }, [user.id]);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const [stats, groups, activity] = await Promise.all([
                getUserStats(user.id),
                getUserGroupsAdmin(user.id),
                getUserRecentExpenses(user.id, 10)
            ]);

            setUserStats(stats);
            setUserGroups(groups);
            setActivities(activity);
        } catch (error) {
            console.error('Error loading user data:', error);
            addToast('Failed to load user data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBanUser = async () => {
        const reason = prompt('Enter ban reason:');
        if (!reason) return;

        try {
            await banUser(user.id, reason);
            addToast('User banned successfully', 'success');
            onUpdate();
            onClose();
        } catch (error) {
            addToast('Failed to ban user', 'error');
        }
    };

    const handleUnbanUser = async () => {
        try {
            await unbanUser(user.id);
            addToast('User unbanned successfully', 'success');
            onUpdate();
            onClose();
        } catch (error) {
            addToast('Failed to unban user', 'error');
        }
    };

    const handleToggleAdmin = async () => {
        try {
            await updateUserRole(user.id, !user.isAdmin);
            addToast(`User ${user.isAdmin ? 'removed from' : 'promoted to'} admin`, 'success');
            onUpdate();
            onClose();
        } catch (error) {
            addToast('Failed to update user role', 'error');
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a1c23] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                                {user.displayName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{user.displayName || 'Unknown User'}</h2>
                                <p className="text-indigo-100">{user.email}</p>
                                <div className="flex gap-2 mt-2">
                                    {user.isAdmin && (
                                        <span className="px-2 py-1 bg-amber-500 text-xs rounded-full font-semibold">ADMIN</span>
                                    )}
                                    {user.isBanned && (
                                        <span className="px-2 py-1 bg-red-500 text-xs rounded-full font-semibold">BANNED</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-3xl">close</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-white/10">
                    <div className="flex gap-1 px-6">
                        {['overview', 'groups', 'finances', 'activity', 'actions'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${activeTab === tab
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && userStats && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.stats.totalExpenses}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Paid</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(userStats.stats.totalPaid)}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Groups</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.stats.groupsCount}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
                                        <p className={`text-2xl font-bold ${userStats.stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(userStats.stats.balance)}
                                        </p>
                                    </div>
                                    <div className="col-span-2 md:col-span-4 bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Joined</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(userStats.stats.joinedDate)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Groups Tab */}
                            {activeTab === 'groups' && (
                                <div className="space-y-2">
                                    {userGroups.length === 0 ? (
                                        <p className="text-center text-gray-500 py-8">No groups found</p>
                                    ) : (
                                        userGroups.map(group => (
                                            <div key={group.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-gray-400">groups</span>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{group.name}</p>
                                                        <p className="text-sm text-gray-500">{group.members?.length || 0} members</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${group.isSettled
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {group.isSettled ? 'Settled' : 'Active'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Finances Tab */}
                            {activeTab === 'finances' && userStats && (
                                <div className="space-y-4">
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl">
                                        <p className="text-sm text-green-700 dark:text-green-400 mb-2">Net Balance</p>
                                        <p className={`text-4xl font-bold ${userStats.stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(userStats.stats.balance)}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Paid</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(userStats.stats.totalPaid)}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Expenses</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">{userStats.stats.totalExpenses}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Activity Tab */}
                            {activeTab === 'activity' && (
                                <div className="space-y-3">
                                    {activities.length === 0 ? (
                                        <p className="text-center text-gray-500 py-8">No recent activity</p>
                                    ) : (
                                        activities.map((activity, index) => (
                                            <div key={activity.id || index} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                                                <span className="material-symbols-outlined text-indigo-500 mt-1">receipt_long</span>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 dark:text-white">{activity.action}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                                                </div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(activity.amount)}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Actions Tab */}
                            {activeTab === 'actions' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            onClick={handleToggleAdmin}
                                            className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-xl transition-colors text-left"
                                        >
                                            <span className="material-symbols-outlined text-amber-600">shield</span>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {user.isAdmin ? 'Revoke admin privileges' : 'Grant admin access'}
                                                </p>
                                            </div>
                                        </button>

                                        {user.isBanned ? (
                                            <button
                                                onClick={handleUnbanUser}
                                                className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-colors text-left"
                                            >
                                                <span className="material-symbols-outlined text-green-600">check_circle</span>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">Unban User</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Restore user access</p>
                                                </div>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleBanUser}
                                                className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors text-left"
                                            >
                                                <span className="material-symbols-outlined text-red-600">block</span>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">Ban User</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Restrict user access</p>
                                                </div>
                                            </button>
                                        )}
                                    </div>

                                    {user.isBanned && (
                                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
                                            <p className="text-sm font-semibold text-red-900 dark:text-red-300">Ban Information</p>
                                            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                                Reason: {user.bannedReason || 'No reason provided'}
                                            </p>
                                            <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                                                Banned on: {formatDate(user.bannedAt)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
