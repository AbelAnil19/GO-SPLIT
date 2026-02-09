import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase/authContext';

const AdminLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();

    const navItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
        { path: '/admin/users', label: 'Users', icon: 'group' },
        { path: '/admin/groups', label: 'Groups', icon: 'groups' },
        { path: '/admin/expenses', label: 'Expenses', icon: 'payments' },
        { path: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0f172a] dark:to-[#1a1c23] flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-[#1a1c23] border-r border-gray-200 dark:border-white/10 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <span className="material-symbols-outlined text-white text-xl">shield</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-[#0d191b] dark:text-white">Admin Panel</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">GoSplit</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/30'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                <span className="font-semibold text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-gray-200 dark:border-white/10 space-y-2">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                        <span className="font-semibold text-sm">Back to Dashboard</span>
                    </Link>

                    <div className="flex items-center gap-3 px-4 py-3">
                        <img
                            src={currentUser?.photoURL || 'https://via.placeholder.com/40'}
                            alt={currentUser?.displayName}
                            className="w-10 h-10 rounded-full border-2 border-amber-400"
                        />
                        <div className="flex-1">
                            <p className="font-semibold text-sm text-[#0d191b] dark:text-white truncate">
                                {currentUser?.displayName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">logout</span>
                        <span className="font-semibold text-sm">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
