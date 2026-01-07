import React, { useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase/authContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { LogoutIcon } from '../icons/LogoutIcon';
import { DashboardIcon } from '../icons/DashboardIcon';
import { UsersIcon } from '../icons/GroupIcon';
import { SettingsIcon } from '../icons/SettingsIcon';
import { ReceiptIcon } from '../icons/ReceiptIcon';
import { HistoryIcon } from '../icons/HistoryIcon';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { doSignOut } = useAuth();
    const { addToast } = useToast();
    const logoutIconRef = useRef(null);
    const dashboardIconRef = useRef(null);
    const groupsIconRef = useRef(null);
    const settingsIconRef = useRef(null);
    const expensesIconRef = useRef(null);
    const historyIconRef = useRef(null);

    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        try {
            await doSignOut();
            addToast('Logged out successfully', 'success');
            navigate('/'); // Redirect to home page
        } catch (error) {
            addToast('Failed to log out', 'error');
        }
    };

    const navItems = [
        { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
        { icon: 'groups', label: 'Groups', path: '/dashboard/groups' },
        { icon: 'receipt_long', label: 'Expenses', path: '/dashboard/expenses' },
        { icon: 'history', label: 'History', path: '/dashboard/history' },
        { icon: 'settings', label: 'Settings', path: '/dashboard/settings' },
    ];

    return (
        <aside className="w-64 h-full hidden lg:flex flex-col bg-white dark:bg-black/40 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 transition-colors duration-300">
            <div className="h-20 flex items-center px-8 border-b border-gray-200 dark:border-white/10">
                <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-[#0d191b] dark:text-white">
                    <span className="material-symbols-outlined text-3xl text-amber-400">account_balance_wallet</span>
                    <span>GoSplit</span>
                </Link>
            </div>

            <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onMouseEnter={() => {
                            if (item.icon === 'dashboard') dashboardIconRef.current?.startAnimation();
                            if (item.icon === 'groups') groupsIconRef.current?.startAnimation();
                            if (item.icon === 'settings') settingsIconRef.current?.startAnimation();
                            if (item.icon === 'receipt_long') expensesIconRef.current?.startAnimation();
                            if (item.icon === 'history') historyIconRef.current?.startAnimation();
                        }}
                        onMouseLeave={() => {
                            if (item.icon === 'dashboard') dashboardIconRef.current?.stopAnimation();
                            if (item.icon === 'groups') groupsIconRef.current?.stopAnimation();
                            if (item.icon === 'settings') settingsIconRef.current?.stopAnimation();
                            if (item.icon === 'receipt_long') expensesIconRef.current?.stopAnimation();
                            if (item.icon === 'history') historyIconRef.current?.stopAnimation();
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive(item.path)
                            ? 'bg-amber-400/20 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.1)]'
                            : 'text-[#5c6f73] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-[#13c8ec] dark:hover:text-amber-400'
                            }`}
                    >
                        {item.icon === 'dashboard' ? (
                            <DashboardIcon ref={dashboardIconRef} size={20} duration={0.6} isAnimated={false} />
                        ) : item.icon === 'groups' ? (
                            <UsersIcon ref={groupsIconRef} size={20} duration={0.7} isAnimated={false} />
                        ) : item.icon === 'settings' ? (
                            <SettingsIcon ref={settingsIconRef} size={20} duration={0.8} isAnimated={false} />
                        ) : item.icon === 'receipt_long' ? (
                            <ReceiptIcon ref={expensesIconRef} size={20} duration={0.8} isAnimated={false} />
                        ) : item.icon === 'history' ? (
                            <HistoryIcon ref={historyIconRef} size={20} duration={0.8} isAnimated={false} />
                        ) : (
                            <span className={`material-symbols-outlined transition-colors duration-300 ${isActive(item.path) ? 'fill-1' : ''}`}>
                                {item.icon}
                            </span>
                        )}
                        <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-white/10">
                <button
                    onClick={handleLogout}
                    onMouseEnter={() => logoutIconRef.current?.startAnimation()}
                    onMouseLeave={() => logoutIconRef.current?.stopAnimation()}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium text-sm group"
                >
                    <LogoutIcon ref={logoutIconRef} size={20} duration={0.6} isAnimated={false} />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
