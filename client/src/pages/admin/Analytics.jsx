import React, { useState, useEffect } from 'react';
import { getSystemStats } from '../../firebase/firestore';
import AdminLayout from '../../components/admin/AdminLayout';
import { useCurrency } from '../../context/CurrencyContext';

const Analytics = () => {
    const { formatAmount } = useCurrency();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const systemStats = await getSystemStats();
            setStats(systemStats);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#0d191b] dark:text-white mb-2">Platform Analytics</h1>
                <p className="text-gray-600 dark:text-gray-400">System-wide statistics and insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">New Users (7 Days)</h3>
                    <div className="text-4xl font-bold text-blue-500">{stats?.recentUsers || 0}</div>
                </div>
                <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Total Money Managed</h3>
                    <div className="text-4xl font-bold text-green-500">{formatAmount(stats?.totalAmount || 0)}</div>
                </div>
                <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Platform Health</h3>
                    <div className="text-4xl font-bold text-emerald-500">Healthy</div>
                </div>
            </div>

            <div className="mt-8 bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-[#0d191b] dark:text-white mb-6">Detailed Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-2xl font-bold text-[#0d191b] dark:text-white">{stats?.totalUsers || 0}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-green-500">{stats?.activeUsers || 0}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-[#0d191b] dark:text-white">{stats?.totalGroups || 0}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Groups</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-blue-500">{stats?.activeGroups || 0}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Active Groups</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-[#0d191b] dark:text-white">{stats?.totalExpenses || 0}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-amber-500">{stats?.pendingSettlements || 0}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Pending Settlements</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-green-500">{stats?.approvedSettlements || 0}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Approved Settlements</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-red-500">{stats?.bannedUsers || 0}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Banned Users</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Analytics;
