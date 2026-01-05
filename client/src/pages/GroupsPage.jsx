import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';
import { listenToUserGroups, createGroup } from '../firebase/firestore';
import AddMemberModal from '../components/AddMemberModal';

const GroupsPage = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState(null);

    // Fetch user's groups with real-time listener
    useEffect(() => {
        if (!currentUser) return;

        setLoading(true);
        const unsubscribe = listenToUserGroups(currentUser.uid, (groupsData) => {
            setGroups(groupsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            addToast('Please enter a group name', 'error');
            return;
        }

        try {
            await createGroup(newGroupName, currentUser.uid, {
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL
            });
            addToast(`Group "${newGroupName}" created!`, 'success');
            setIsCreateModalOpen(false);
            setNewGroupName('');
        } catch (error) {
            console.error('Error creating group:', error);
            addToast('Failed to create group', 'error');
        }
    };

    // Filter groups based on search
    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Page Heading & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#0d191b] dark:text-white tracking-tight">Your Groups</h2>
                    <p className="text-[#5c6f73] dark:text-gray-400">Manage your shared expenses and group balances</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-amber-400 hover:bg-amber-300 text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-900/20 transition-all transform active:scale-95"
                >
                    <span className="material-symbols-outlined">add</span>
                    Create New Group
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 rounded-2xl p-6 bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/10 shadow-soft backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <p className="text-[#5c6f73] dark:text-gray-400 font-medium">Total Groups</p>
                        <span className="material-symbols-outlined text-amber-400 bg-amber-400/10 p-1.5 rounded-lg">groups</span>
                    </div>
                    <p className="text-[#0d191b] dark:text-white text-3xl font-bold tracking-tight">{groups.length}</p>
                    <p className="text-[#5c6f73] dark:text-gray-400 text-sm font-medium mt-1">active groups</p>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl p-6 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-soft backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-400 font-medium">Total Members</p>
                        <span className="material-symbols-outlined text-blue-400 bg-blue-400/10 p-1.5 rounded-lg">people</span>
                    </div>
                    <p className="text-white text-3xl font-bold tracking-tight">
                        {groups.reduce((sum, g) => sum + (g.members?.length || 0), 0)}
                    </p>
                    <p className="text-gray-400 text-sm font-medium mt-1">across all groups</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <input
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all backdrop-blur-md"
                        placeholder="Search groups by name..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-gray-500 dark:text-gray-400">search</span>
                </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Loading State */}
                {loading && (
                    <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                        <span className="material-symbols-outlined text-6xl text-amber-400 animate-spin">refresh</span>
                        <p className="text-white/60">Loading groups...</p>
                    </div>
                )}

                {/* No Groups State */}
                {!loading && filteredGroups.length === 0 && !searchQuery && (
                    <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                        <span className="material-symbols-outlined text-6xl text-white/20">group_off</span>
                        <p className="text-white/60">No groups yet. Create your first group!</p>
                    </div>
                )}

                {/* No Search Results */}
                {!loading && filteredGroups.length === 0 && searchQuery && (
                    <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                        <span className="material-symbols-outlined text-6xl text-white/20">search_off</span>
                        <p className="text-white/60">No groups found matching "{searchQuery}"</p>
                    </div>
                )}

                {/* Real Group Cards */}
                {!loading && filteredGroups.map((group) => (
                    <div
                        key={group.id}
                        className="group flex flex-col justify-between bg-white dark:bg-white/5 p-5 rounded-2xl border-2 border-gray-300 dark:border-white/10 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300 backdrop-blur-md shadow-soft"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                                    <span className="material-symbols-outlined">{group.icon || 'groups'}</span>
                                </div>
                                <button
                                    onClick={() => setSelectedGroup(group)}
                                    className="text-gray-400 hover:text-amber-400 transition-colors"
                                    title="Add Member"
                                >
                                    <span className="material-symbols-outlined">person_add</span>
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-[#0d191b] dark:text-white mb-1">{group.name}</h3>
                            <p className="text-sm text-[#5c6f73] dark:text-gray-400 mb-4">
                                {group.members?.length || 0} member{(group.members?.length || 0) !== 1 ? 's' : ''}
                            </p>
                            <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Expenses</p>
                                <p className="text-xl font-bold text-white">${group.totalExpenses || 0}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                            <div className="flex items-center -space-x-2">
                                {group.members?.slice(0, 3).map((member, idx) => (
                                    <div
                                        key={idx}
                                        className="size-8 rounded-full border-2 border-white dark:border-[#0f172a] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-black"
                                        title={member.name}
                                    >
                                        {member.name?.charAt(0)}
                                    </div>
                                ))}
                                {(group.members?.length || 0) > 3 && (
                                    <div className="size-8 rounded-full border-2 border-white dark:border-[#0f172a] bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-[#5c6f73] dark:text-gray-400">
                                        +{(group.members?.length || 0) - 3}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedGroup(group)}
                                className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Add Member
                            </button>
                        </div>
                    </div>
                ))}

                {/* Create New Group Card */}
                {!loading && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="group flex flex-col items-center justify-center gap-4 bg-transparent p-5 rounded-2xl border-2 border-dashed border-white/10 hover:border-amber-400/50 hover:bg-amber-400/5 transition-all duration-300 min-h-[250px] cursor-pointer backdrop-blur-md"
                    >
                        <div className="size-16 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center shadow-sm transition-colors">
                            <span className="material-symbols-outlined text-amber-400 text-3xl">add</span>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">Create New Group</h3>
                            <p className="text-sm text-gray-400 mt-1">Start sharing expenses</p>
                        </div>
                    </button>
                )}
            </div>

            {/* Create Group Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/10">
                        <h3 className="text-2xl font-bold text-white mb-4">Create New Group</h3>
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Enter group name..."
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent mb-6"
                            onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    setNewGroupName('');
                                }}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                className="flex-1 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-black rounded-xl font-semibold transition-colors"
                            >
                                Create Group
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            <AddMemberModal
                isOpen={selectedGroup !== null}
                onClose={() => setSelectedGroup(null)}
                groupId={selectedGroup?.id}
                groupName={selectedGroup?.name}
                currentMembers={selectedGroup?.members || []}
            />
        </div>
    );
};

export default GroupsPage;
