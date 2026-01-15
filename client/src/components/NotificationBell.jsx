import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../firebase/authContext';
import { listenToUserNotifications, markNotificationRead, markAllNotificationsRead } from '../firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { BellIcon } from './icons/NotificationIcon';

const NotificationBell = () => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [showPopover, setShowPopover] = useState(false);
    const popoverRef = useRef(null);
    const bellIconRef = useRef(null);
    const navigate = useNavigate();

    // Listen to notifications
    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = listenToUserNotifications(currentUser.uid, setNotifications);
        return () => unsubscribe();
    }, [currentUser]);

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setShowPopover(false);
            }
        };

        if (showPopover) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPopover]);

    const unreadCount = notifications.length;

    const handleNotificationClick = async (notification) => {
        await markNotificationRead(notification.id);
        setShowPopover(false);

        // Navigate to relevant page based on notification type
        const { metadata } = notification;
        if (metadata.groupId) {
            navigate(`/dashboard/groups/${metadata.groupId}`);
        }
    };

    const handleMarkAllRead = async () => {
        await markAllNotificationsRead(currentUser.uid);
    };

    return (
        <div className="relative" ref={popoverRef}>
            {/* Bell Icon Button */}
            <button
                onClick={() => setShowPopover(!showPopover)}
                onMouseEnter={() => bellIconRef.current?.startAnimation()}
                onMouseLeave={() => bellIconRef.current?.stopAnimation()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border ${showPopover ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white border-gray-200 dark:border-white/10' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white border-transparent hover:border-gray-200 dark:hover:border-white/10'}`}
                title="Notifications"
            >
                <BellIcon ref={bellIconRef} size={20} duration={0.8} isAnimated={false} />

                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Popover */}
            {showPopover && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-[#1a1c23] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                        <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-semibold transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-3 block">
                                    notifications_off
                                </span>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">
                                    No new notifications
                                </p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                    You're all caught up!
                                </p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <NotificationItem
                                    key={notif.id}
                                    notification={notif}
                                    onClick={() => handleNotificationClick(notif)}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const NotificationItem = ({ notification, onClick }) => {
    const getIcon = () => {
        switch (notification.type) {
            case 'expense': return '💰';
            case 'payment': return '✅';
            case 'settlement': return '💸';
            case 'message': return '💬';
            case 'group_add': return '👥';
            case 'invite': return '📝';
            default: return '🔔';
        }
    };

    const getTimeAgo = () => {
        if (!notification.createdAt?.toDate) return 'Just now';

        const now = new Date();
        const created = notification.createdAt.toDate();
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    return (
        <button
            onClick={onClick}
            className="w-full p-4 hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 text-left transition-colors"
        >
            <div className="flex gap-3">
                <span className="text-2xl flex-shrink-0">{getIcon()}</span>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                        {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {getTimeAgo()}
                    </p>
                </div>
            </div>
        </button>
    );
};

export default NotificationBell;
