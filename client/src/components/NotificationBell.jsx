import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../firebase/authContext';
import { listenToUserNotifications, markNotificationRead, markAllNotificationsRead, listenToUserInvitations, acceptGroupInvitation, declineGroupInvitation, approveJoinRequest, rejectJoinRequest } from '../firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { BellIcon } from './icons/NotificationIcon';
import { useToast } from '../context/ToastContext';

const NotificationBell = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [notifications, setNotifications] = useState([]);
    const [invitations, setInvitations] = useState([]);
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

    // Show toast for specific real-time notifications
    // We use a ref to track which notifications we've already "seen" in this session to avoid spamming on reload
    // but allowing real-time alerts
    const seenNotificationIds = useRef(new Set());

    useEffect(() => {
        // Initialize seen set on first load if empty (assume existing ones are "seen" to avoid alert bomb on refresh)
        if (notifications.length > 0 && seenNotificationIds.current.size === 0) {
            notifications.forEach(n => seenNotificationIds.current.add(n.id));
            return;
        }

        notifications.forEach(notification => {
            if (!seenNotificationIds.current.has(notification.id)) {
                // This is a new real-time notification
                if (notification.metadata?.type === 'missing_upi') {
                    addToast(
                        'Action Required: Someone tried to pay you! Please add your UPI ID. (Click to Add)',
                        'warning',
                        {
                            duration: 8000,
                            onClick: () => navigate('/dashboard/settings')
                        }
                    );
                }
                seenNotificationIds.current.add(notification.id);
            }
        });
    }, [notifications, addToast]);

    // Listen to invitations
    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = listenToUserInvitations(currentUser.uid, setInvitations);
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

    const unreadCount = notifications.length + invitations.length;

    const handleInvitationAccept = async (invitationId, groupName) => {
        try {
            await acceptGroupInvitation(invitationId, currentUser.uid);
            addToast(`You joined ${groupName}!`, 'success');
        } catch (error) {
            addToast('Failed to accept invitation', 'error');
        }
    };

    const handleInvitationDecline = async (invitationId, groupName) => {
        try {
            await declineGroupInvitation(invitationId);
            addToast(`Invitation to ${groupName} declined`, 'info');
        } catch (error) {
            addToast('Failed to decline invitation', 'error');
        }
    };

    const handleNotificationClick = async (notification) => {
        await markNotificationRead(notification.id);
        setShowPopover(false);

        // Navigate to relevant page based on notification type
        if (notification.type === 'system') {
            // Don't navigate to the group if removed, maybe just stay on dashboard
            return;
        }

        if (metadata?.type === 'missing_upi') {
            navigate('/dashboard/settings');
            return;
        }

        if (metadata?.groupId) {
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
                        {notifications.length === 0 && invitations.length === 0 ? (
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
                            <>
                                {/* Invitations Section */}
                                {invitations.length > 0 && (
                                    <div className="border-b border-gray-200 dark:border-white/10">
                                        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10">
                                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                                                Group Invitations
                                            </p>
                                        </div>
                                        {invitations.map(invitation => (
                                            <InvitationItem
                                                key={invitation.id}
                                                invitation={invitation}
                                                onAccept={handleInvitationAccept}
                                                onDecline={handleInvitationDecline}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Notifications Section */}
                                {notifications.length > 0 && (
                                    <>
                                        {invitations.length > 0 && (
                                            <div className="px-4 py-2 bg-gray-50 dark:bg-white/5">
                                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                                                    Activity
                                                </p>
                                            </div>
                                        )}
                                        {notifications.map(notif => (
                                            <NotificationItem
                                                key={notif.id}
                                                notification={notif}
                                                onClick={() => handleNotificationClick(notif)}
                                            />
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const NotificationItem = ({ notification, onClick }) => {
    const { addToast } = useToast();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleApprove = async (e) => {
        e.stopPropagation();
        setLoading(true);
        try {
            await approveJoinRequest(notification.id, notification.metadata, currentUser.displayName);
            addToast('Request approved! Invitation sent.', 'success');
        } catch (error) {
            addToast('Failed to approve request', 'error');
        }
        setLoading(false);
    };

    const handleReject = async (e) => {
        e.stopPropagation();
        setLoading(true);
        try {
            await rejectJoinRequest(notification.id);
            addToast('Request rejected', 'info');
        } catch (error) {
            addToast('Failed to reject request', 'error');
        }
        setLoading(false);
    };

    const getIcon = () => {
        switch (notification.type) {
            case 'expense': return '💰';
            case 'payment': return '✅';
            case 'settlement': return '💸';
            case 'message': return '💬';
            case 'group_add': return '👥';
            case 'invite': return '📝';
            case 'system': return '⚠️';
            case 'approval_request': return '🙋‍♂️';
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

                    {notification.type === 'approval_request' && (
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleReject}
                                disabled={loading}
                                className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                                Reject
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={loading}
                                className="flex-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Approving...' : 'Approve'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
};

const InvitationItem = ({ invitation, onAccept, onDecline }) => {
    const [loading, setLoading] = useState(false);

    const handleAccept = async () => {
        setLoading(true);
        await onAccept(invitation.id, invitation.groupName);
        setLoading(false);
    };

    const handleDecline = async () => {
        setLoading(true);
        await onDecline(invitation.id, invitation.groupName);
        setLoading(false);
    };

    return (
        <div className="p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <div className="flex gap-3">
                <span className="text-2xl flex-shrink-0">👥</span>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                        {invitation.groupName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        Invited by {invitation.inviterName}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDecline}
                            disabled={loading}
                            className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                            Decline
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={loading}
                            className="flex-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Accepting...' : 'Accept'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationBell;
