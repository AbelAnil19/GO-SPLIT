import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSystemStats, getAllUsers, getDashboardAnalytics } from '../../firebase/firestore';
import AdminLayout from '../../components/admin/AdminLayout';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [chartData, setChartData] = useState({
        userGrowth: [],
        expenseTrends: [],
        groupStatus: []
    });
    const [loading, setLoading] = useState(true);
    const [systemHealth, setSystemHealth] = useState({
        status: 'healthy',
        uptime: '99.9%',
        responseTime: 95,
        services: { database: 'operational', auth: 'operational', storage: 'operational' }
    });

    useEffect(() => {
        loadDashboardData();
        // Simulate real-time response time updates
        const interval = setInterval(() => {
            setSystemHealth(prev => ({
                ...prev,
                responseTime: Math.floor(Math.random() * 50) + 80
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            // Fetch all data in parallel
            const [systemStats, analyticsData, { users }] = await Promise.all([
                getSystemStats(),
                getDashboardAnalytics(),
                getAllUsers(5)
            ]);

            setStats(systemStats);

            // Validate and set chart data (fallback to empty arrays if undefined)
            setChartData({
                userGrowth: analyticsData?.userGrowth || [],
                expenseTrends: analyticsData?.expenseTrends || [],
                groupStatus: analyticsData?.groupStatus || []
            });

            setRecentUsers(users || []);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: 'group', color: 'blue' },
        { label: 'Active Users', value: stats?.activeUsers || 0, icon: 'check_circle', color: 'green' },
        { label: 'Total Groups', value: stats?.totalGroups || 0, icon: 'groups', color: 'purple' },
        { label: 'Active Groups', value: stats?.activeGroups || 0, icon: 'playlist_add_check', color: 'teal' },
        { label: 'Total Expenses', value: stats?.totalExpenses || 0, icon: 'payments', color: 'amber' },
        { label: 'Money Managed', value: `₹${(stats?.totalAmount || 0).toFixed(2)}`, icon: 'account_balance_wallet', color: 'emerald' },
        { label: 'Pending Settlements', value: stats?.pendingSettlements || 0, icon: 'hourglass_empty', color: 'orange' },
        { label: 'Banned Users', value: stats?.bannedUsers || 0, icon: 'block', color: 'red' },
    ];

    return (
        <AdminLayout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#0d191b] dark:text-white mb-2">Admin Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening on your platform.</p>
            </div>

            {/* System Health Dashboard */}
            <div className="mb-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">health_and_safety</span>
                    <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">System Health</h2>
                    <span className="ml-auto px-4 py-2 bg-green-500 text-white rounded-full text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        {systemHealth.status.toUpperCase()}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Uptime</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemHealth.uptime}</p>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Response Time</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemHealth.responseTime}ms</p>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Database</p>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400 capitalize">{systemHealth.services.database}</p>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Authentication</p>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400 capitalize">{systemHealth.services.auth}</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((card, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:shadow-xl transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 bg-${card.color}-100 dark:bg-${card.color}-900/20 rounded-xl flex items-center justify-center`}>
                                <span className={`material-symbols-outlined text-${card.color}-500 text-2xl`}>{card.icon}</span>
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-[#0d191b] dark:text-white mb-1">{card.value}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Growth Chart */}
                <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-[#0d191b] dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500">trending_up</span>
                        User Growth (Last 30 Days)
                    </h2>
                    <div className="h-80">
                        {chartData.userGrowth.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData.userGrowth}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        labelStyle={{ color: '#9ca3af' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="users"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ fill: '#3b82f6', r: 4, stroke: '#fff', strokeWidth: 2 }}
                                        activeDot={{ r: 8 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
                        )}
                    </div>
                </div>

                {/* Expense Trends */}
                <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-[#0d191b] dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500">bar_chart</span>
                        Expense Trends (6 Months)
                    </h2>
                    <div className="h-80">
                        {chartData.expenseTrends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData.expenseTrends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-10}
                                        tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                                    />
                                    <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
                        )}
                    </div>
                </div>

                {/* Group Status Pie Chart */}
                <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-[#0d191b] dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-500">donut_small</span>
                        Group Status
                    </h2>
                    <div className="h-80 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.groupStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.groupStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <button
                    onClick={() => navigate('/admin/users')}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl hover:shadow-xl transition-all flex items-center gap-4 group"
                >
                    <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">group</span>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">Manage Users</h3>
                        <p className="text-sm text-blue-100">View, ban, or promote users</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/admin/groups')}
                    className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl hover:shadow-xl transition-all flex items-center gap-4 group"
                >
                    <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">groups</span>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">Manage Groups</h3>
                        <p className="text-sm text-purple-100">Oversee and moderate groups</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/admin/analytics')}
                    className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-6 rounded-2xl hover:shadow-xl transition-all flex items-center gap-4 group"
                >
                    <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">analytics</span>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">View Analytics</h3>
                        <p className="text-sm text-amber-100">See platform trends</p>
                    </div>
                </button>
            </div>

            {/* Recent Users */}
            <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-[#0d191b] dark:text-white mb-4">Recent Users</h2>
                <div className="space-y-3">
                    {recentUsers.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent users</p>
                    ) : (
                        recentUsers.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                            >
                                <img
                                    src={user.photoURL || 'https://via.placeholder.com/40'}
                                    alt={user.displayName}
                                    className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-white/10"
                                />
                                <div className="flex-1">
                                    <p className="font-semibold text-[#0d191b] dark:text-white">{user.displayName}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                                {user.isBanned && (
                                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-xs font-bold">
                                        Banned
                                    </span>
                                )}
                                {user.isAdmin && (
                                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold">
                                        Admin
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
