import React, { useState } from 'react';
import { useAuth } from '../../firebase/authContext';
import { useToast } from '../../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const DashboardHeader = () => {
    const { currentUser, doSignOut } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const handleLogout = async () => {
        try {
            await doSignOut();
            addToast('Logged out successfully', 'success');
            navigate('/'); // Redirect to home page
        } catch (error) {
            addToast('Failed to log out', 'error');
        }
    };

    const handleProfileToggle = () => {
        setIsProfileOpen(!isProfileOpen);
    };

    return (
        <header className="h-20 bg-white dark:bg-black/40 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-8 flex-shrink-0 z-10 relative transition-colors duration-300 shadow-sm">
            <div>
                <h1 className="text-xl font-bold text-[#0d191b] dark:text-white">Dashboard</h1>
                <p className="text-sm text-[#5c6f73] dark:text-gray-400">{getGreeting()}, {currentUser?.displayName?.split(' ')[0] || 'User'}!</p>
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border ${isNotifOpen ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white border-gray-200 dark:border-white/10' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white border-transparent dark:hover:border-white/10'}`}
                    >
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0f172a] pointer-events-none"></span>

                    {isNotifOpen && (
                        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                <h3 className="font-bold text-white">Notifications</h3>
                                <button className="text-xs text-amber-400 hover:text-amber-300">Mark all read</button>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <div className="p-4 text-center text-gray-500 text-sm">No new notifications</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors border text-gray-400 hover:bg-white/10 hover:text-white border-transparent hover:border-white/10"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    <span className="material-symbols-outlined">
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>

                <div className="w-px h-8 bg-white/10 mx-2"></div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={handleProfileToggle}
                        className={`flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full transition-colors border ${isProfileOpen ? 'bg-gray-100 dark:bg-white/10 border-gray-200 dark:border-white/10' : 'border-transparent hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-200 dark:hover:border-white/10'} group`}
                    >
                        <div className="relative">
                            {currentUser?.photoURL ? (
                                <img
                                    src={currentUser.photoURL}
                                    alt="User"
                                    className="w-8 h-8 rounded-full object-cover border border-white/20 group-hover:border-amber-400/50 transition-colors"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30 text-amber-500 text-xs font-bold">
                                    {currentUser?.displayName?.charAt(0) || 'U'}
                                </div>
                            )}
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0f172a] rounded-full"></span>
                        </div>
                        <span className="text-sm font-bold text-[#0d191b] dark:text-white hidden md:block">{currentUser?.displayName || 'User'}</span>
                        <span className={`material-symbols-outlined text-lg text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-all ${isProfileOpen ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 top-14 w-48 bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                            <div className="p-2">
                                <Link to="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 text-sm text-[#5c6f73] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#0d191b] dark:hover:text-white rounded-lg transition-colors">
                                    <span className="material-symbols-outlined text-lg">person</span> Profile
                                </Link>
                                <Link to="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 text-sm text-[#5c6f73] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#0d191b] dark:hover:text-white rounded-lg transition-colors">
                                    <span className="material-symbols-outlined text-lg">settings</span> Settings
                                </Link>
                                <div className="h-px bg-white/10 my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                                >
                                    <span className="material-symbols-outlined text-lg">logout</span> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Click outside listener could be added here for closing dropdowns */}
            {(isProfileOpen || isNotifOpen) && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => {
                        setIsProfileOpen(false);
                        setIsNotifOpen(false);
                    }}
                ></div>
            )}
        </header>
    );
};

export default DashboardHeader;
