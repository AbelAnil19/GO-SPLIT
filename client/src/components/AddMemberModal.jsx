import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { sendGroupInvitation } from '../firebase/firestore';
import { useAuth } from '../firebase/authContext';

const AddMemberModal = ({ isOpen, onClose, groupId, groupName, currentMembers = [] }) => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendInvitation = async () => {
        if (!email.trim()) {
            addToast('Please enter an email address', 'error');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            addToast('Please enter a valid email address', 'error');
            return;
        }

        setLoading(true);
        try {
            await sendGroupInvitation(
                groupId,
                groupName,
                currentUser.displayName,
                email
            );
            addToast(`Invitation sent to ${email}!`, 'success');
            setEmail('');
            onClose();
        } catch (error) {
            addToast(error.message || 'Failed to send invitation', 'error');
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add Member</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-gray-400 text-sm mb-4">
                        Add a member to <span className="text-white font-semibold">{groupName}</span> by entering their email address.
                    </p>

                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="member@example.com"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendInvitation()}
                        autoFocus
                        disabled={loading}
                    />

                    {currentMembers.length > 0 && (
                        <div className="mt-4 p-3 bg-white/5 rounded-xl">
                            <p className="text-xs text-gray-400 mb-2">Current members:</p>
                            <div className="flex flex-wrap gap-2">
                                {currentMembers.map((member, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg"
                                    >
                                        <div className="size-6 rounded-full bg-amber-400 flex items-center justify-center text-xs font-bold text-black">
                                            {member.name?.charAt(0)}
                                        </div>
                                        <span className="text-xs text-white">{member.name}</span>
                                        {member.role === 'admin' && (
                                            <span className="text-xs text-amber-400">★</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
                    <div className="flex gap-2">
                        <span className="material-symbols-outlined text-amber-400 text-sm">info</span>
                        <div className="text-xs text-amber-300">
                            <p className="font-semibold mb-1">Invitation will be sent</p>
                            <p>The user will receive an invitation and must accept it to join the group.</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSendInvitation}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-black rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                                Sending...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">send</span>
                                Send Invitation
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal;
