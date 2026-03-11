import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';
import { listenToUserInvitations, acceptGroupInvitation, declineGroupInvitation } from '../firebase/firestore';

const GroupInvitations = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState({});

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = listenToUserInvitations(currentUser.uid, (invites) => {
            setInvitations(invites);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleAccept = async (invitationId, groupName) => {
        setLoading(prev => ({ ...prev, [invitationId]: 'accepting' }));
        try {
            await acceptGroupInvitation(invitationId, currentUser.uid);
            addToast(`You joined ${groupName}!`, 'success');
        } catch (error) {
            addToast('Failed to accept invitation', 'error');
        }
        setLoading(prev => ({ ...prev, [invitationId]: null }));
    };

    const handleDecline = async (invitationId, groupName) => {
        setLoading(prev => ({ ...prev, [invitationId]: 'declining' }));
        try {
            await declineGroupInvitation(invitationId);
            addToast(`Invitation to ${groupName} declined`, 'info');
        } catch (error) {
            addToast('Failed to decline invitation', 'error');
        }
        setLoading(prev => ({ ...prev, [invitationId]: null }));
    };

    if (invitations.length === 0) return null;

    return (
        <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 dark:text-amber-400">mail</span>
                Group Invitations
            </h3>
            <div className="space-y-3">
                {invitations.map((invitation) => (
                    <div
                        key={invitation.id}
                        className="bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] p-4 rounded-xl border-2 border-gray-200 dark:border-white/10 flex items-center justify-between shadow-md dark:shadow-none backdrop-blur-[2px]"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">groups</span>
                                <p className="text-gray-900 dark:text-white font-semibold">{invitation.groupName}</p>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Invited by {invitation.inviterName}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleDecline(invitation.id, invitation.groupName)}
                                disabled={loading[invitation.id]}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-lg font-bold transition-colors disabled:opacity-50 text-sm"
                            >
                                {loading[invitation.id] === 'declining' ? 'Declining...' : 'Decline'}
                            </button>
                            <button
                                onClick={() => handleAccept(invitation.id, invitation.groupName)}
                                disabled={loading[invitation.id]}
                                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black rounded-lg font-bold transition-colors disabled:opacity-50 text-sm flex items-center gap-1 shadow-sm hover:shadow-md"
                            >
                                {loading[invitation.id] === 'accepting' ? (
                                    <>
                                        <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                                        Accepting...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">check</span>
                                        Accept
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GroupInvitations;
