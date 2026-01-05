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
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">mail</span>
                Group Invitations
            </h3>
            <div className="space-y-3">
                {invitations.map((invitation) => (
                    <div
                        key={invitation.id}
                        className="bg-gradient-to-r from-amber-500/10 to-transparent p-4 rounded-xl border border-amber-500/20 flex items-center justify-between"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-amber-400">groups</span>
                                <p className="text-white font-semibold">{invitation.groupName}</p>
                            </div>
                            <p className="text-sm text-gray-400">
                                Invited by {invitation.inviterName}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleDecline(invitation.id, invitation.groupName)}
                                disabled={loading[invitation.id]}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
                            >
                                {loading[invitation.id] === 'declining' ? 'Declining...' : 'Decline'}
                            </button>
                            <button
                                onClick={() => handleAccept(invitation.id, invitation.groupName)}
                                disabled={loading[invitation.id]}
                                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm flex items-center gap-1"
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
