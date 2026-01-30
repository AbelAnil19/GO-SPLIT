import React, { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DashboardIcon } from '../icons/DashboardIcon';
import { UsersIcon } from '../icons/GroupIcon';
import { ReceiptIcon } from '../icons/ReceiptIcon';
import { HistoryIcon } from '../icons/HistoryIcon';
import { SettingsIcon } from '../icons/SettingsIcon';
import { LogoutIcon } from '../icons/LogoutIcon';
import { FlightIcon } from '../icons/FlightIcon';
import { useAuth } from '../../firebase/authContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { doSignOut } from '../../firebase/auth';

import { useTranslation } from 'react-i18next';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { t } = useTranslation();
    const dashboardIconRef = useRef(null);
    const groupsIconRef = useRef(null);
    const expensesIconRef = useRef(null);
    const flightIconRef = useRef(null);
    const historyIconRef = useRef(null);
    const settingsIconRef = useRef(null);
    const logoutIconRef = useRef(null);

    const navItems = [
        { icon: 'dashboard', label: t('sidebar.dashboard'), path: '/dashboard' },
        { icon: 'groups', label: t('sidebar.groups'), path: '/dashboard/groups' },
        { icon: 'receipt_long', label: t('sidebar.expenses'), path: '/dashboard/expenses' },
        { icon: 'flight_takeoff', label: t('sidebar.travelBudget'), path: '/dashboard/trip-planner' },
        { icon: 'history', label: t('sidebar.history'), path: '/dashboard/history' },
        { icon: 'settings', label: t('sidebar.settings'), path: '/dashboard/settings' }
    ];

    const isActive = (path) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    const handleLogout = async () => {
        try {
            await doSignOut();
            addToast('Logged out successfully', 'success');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            addToast('Failed to logout', 'error');
        }
    };

    return (
        <aside className="w-64 bg-white dark:bg-[#1a1c23] flex-shrink-0 h-screen flex flex-col border-r border-gray-200 dark:border-white/10 relative sidebar-pattern">
            {/* Logo */}
            <div className="p-6 pb-8 border-b border-gray-200 dark:border-white/10 relative z-10">
                <Link to="/dashboard" className="flex items-center justify-center group">
                    <span className="text-2xl font-black text-[#0d191b] dark:text-white group-hover:text-amber-400 transition-colors">
                        GoSplit
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto relative z-10">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onMouseEnter={() => {
                            if (item.icon === 'dashboard') dashboardIconRef.current?.startAnimation();
                            if (item.icon === 'groups') groupsIconRef.current?.startAnimation();
                            if (item.icon === 'receipt_long') expensesIconRef.current?.startAnimation();
                            if (item.icon === 'flight_takeoff') flightIconRef.current?.startAnimation();
                            if (item.icon === 'history') historyIconRef.current?.startAnimation();
                            if (item.icon === 'settings') settingsIconRef.current?.startAnimation();
                        }}
                        onMouseLeave={() => {
                            if (item.icon === 'dashboard') dashboardIconRef.current?.stopAnimation();
                            if (item.icon === 'groups') groupsIconRef.current?.stopAnimation();
                            if (item.icon === 'receipt_long') expensesIconRef.current?.stopAnimation();
                            if (item.icon === 'flight_takeoff') flightIconRef.current?.stopAnimation();
                            if (item.icon === 'history') historyIconRef.current?.stopAnimation();
                            if (item.icon === 'settings') settingsIconRef.current?.stopAnimation();
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive(item.path)
                            ? 'bg-amber-400/20 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.1)]'
                            : 'text-[#5c6f73] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-[#13c8ec] dark:hover:text-amber-400'
                            }`}
                    >
                        {item.icon === 'dashboard' && <DashboardIcon ref={dashboardIconRef} size={20} duration={0.8} isAnimated={false} />}
                        {item.icon === 'groups' && <UsersIcon ref={groupsIconRef} size={20} duration={0.8} isAnimated={false} />}
                        {item.icon === 'receipt_long' && <ReceiptIcon ref={expensesIconRef} size={20} duration={0.8} isAnimated={false} />}
                        {item.icon === 'flight_takeoff' && <FlightIcon ref={flightIconRef} size={20} duration={0.8} isAnimated={false} />}
                        {item.icon === 'history' && <HistoryIcon ref={historyIconRef} size={20} duration={0.8} isAnimated={false} />}
                        {item.icon === 'settings' && <SettingsIcon ref={settingsIconRef} size={20} duration={0.8} isAnimated={false} />}
                        <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Logout Button - Fixed at bottom */}
            <div className="p-4 border-t border-gray-200 dark:border-white/10 relative z-10">
                <button
                    onClick={handleLogout}
                    onMouseEnter={() => logoutIconRef.current?.startAnimation()}
                    onMouseLeave={() => logoutIconRef.current?.stopAnimation()}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#5c6f73] dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 w-full group"
                >
                    <LogoutIcon ref={logoutIconRef} size={20} duration={0.8} isAnimated={false} />
                    <span className="font-medium text-sm">{t('sidebar.logout')}</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
