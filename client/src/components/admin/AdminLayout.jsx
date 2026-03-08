import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase/authContext';

const AdminLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
        { path: '/admin/users', label: 'Users', icon: 'group' },
        { path: '/admin/groups', label: 'Groups', icon: 'groups' },
        { path: '/admin/expenses', label: 'Expenses', icon: 'payments' },
        { path: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
        { path: '/admin/support', label: 'Support', icon: 'support_agent' },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-[#0a0f14] dark:via-[#0d191b] dark:to-[#0a0f14] overflow-hidden flex relative">

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
                transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:block flex-shrink-0
            `}>
                <aside className="w-64 h-full bg-white dark:bg-[#1a1c23] border-r border-gray-200 dark:border-white/10 flex flex-col">
                    {/* Logo */}
                    <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <span className="material-symbols-outlined text-white text-xl">shield</span>
                            </div>
                            <div>
                                <h1 className="font-bold text-lg text-[#0d191b] dark:text-white">Admin Panel</h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400">GoSplit</p>
                            </div>
                        </div>
                        {/* Mobile close button inside sidebar */}
                        <button
                            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
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
                                className="w-10 h-10 rounded-full border-2 border-amber-400 object-cover"
                            />
                            <div className="flex-1 w-0">
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
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">

                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-[#1a1c23] border-b border-gray-200 dark:border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-sm">shield</span>
                        </div>
                        <h1 className="font-bold text-lg text-[#0d191b] dark:text-white">Admin</h1>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto w-full relative">
                    <div className="min-h-full p-4 md:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
