import React, { useState, useEffect } from 'react';
import { getAllUsers, banUser, unbanUser, updateUserRole, searchUsers } from '../../firebase/firestore';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/admin/AdminLayout';
import UserProfileModal from '../../components/admin/UserProfileModal';

const UserManagement = () => {
    const { addToast } = useToast();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [banReason, setBanReason] = useState('');

    // Filter states
    const [statusFilter, setStatusFilter] = useState('all'); // all, active, banned
    const [roleFilter, setRoleFilter] = useState('all'); // all, admin, regular
    const [sortBy, setSortBy] = useState('name'); // name, email, date

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [users, statusFilter, roleFilter, sortBy, searchTerm]);

    const loadUsers = async () => {
        try {
            const { users: fetchedUsers } = await getAllUsers(100);
            setUsers(fetchedUsers);
        } catch (error) {
            console.error('Error loading users:', error);
            addToast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...users];

        // Apply search
        if (searchTerm.trim()) {
            filtered = filtered.filter(user =>
                user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply status filter
        if (statusFilter === 'active') {
            filtered = filtered.filter(u => !u.isBanned);
        } else if (statusFilter === 'banned') {
            filtered = filtered.filter(u => u.isBanned);
        }

        // Apply role filter
        if (roleFilter === 'admin') {
            filtered = filtered.filter(u => u.isAdmin);
        } else if (roleFilter === 'regular') {
            filtered = filtered.filter(u => !u.isAdmin);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            if (sortBy === 'name') {
                return (a.displayName || '').localeCompare(b.displayName || '');
            } else if (sortBy === 'email') {
                return (a.email || '').localeCompare(b.email || '');
            } else if (sortBy === 'date') {
                const aDate = a.createdAt?.toMillis?.() || 0;
                const bDate = b.createdAt?.toMillis?.() || 0;
                return bDate - aDate; // Newest first
            }
            return 0;
        });

        setFilteredUsers(filtered);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setRoleFilter('all');
        setSortBy('name');
    };

    const handleBanUser = async () => {
        if (!selectedUser || !banReason.trim()) {
            addToast('Please provide a ban reason', 'error');
            return;
        }

        try {
            await banUser(selectedUser.id, banReason);
            addToast(`${selectedUser.displayName} has been banned`, 'success');
            setIsBanModalOpen(false);
            setBanReason('');
            setSelectedUser(null);
            loadUsers();
        } catch (error) {
            console.error('Error banning user:', error);
            addToast('Failed to ban user', 'error');
        }
    };

    const handleUnbanUser = async (user) => {
        try {
            await unbanUser(user.id);
            addToast(`${user.displayName} has been unbanned`, 'success');
            loadUsers();
        } catch (error) {
            console.error('Error unbanning user:', error);
            addToast('Failed to unban user', 'error');
        }
    };

    const handleToggleAdmin = async (user) => {
        try {
            await updateUserRole(user.id, !user.isAdmin);
            addToast(`${user.displayName} ${user.isAdmin ? 'removed from' : 'promoted to'} admin`, 'success');
            loadUsers();
        } catch (error) {
            console.error('Error updating role:', error);
            addToast('Failed to update user role', 'error');
        }
    };

    const openProfileModal = (user) => {
        setSelectedUser(user);
        setIsProfileModalOpen(true);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#0d191b] dark:text-white mb-2">User Management</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage all users on the platform</p>
            </div>

            {/* Search & Filters */}
            <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6 mb-6">
                <div className="flex flex-col gap-4">
                    {/* Search Bar */}
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-[#0d191b] dark:text-white focus:outline-none focus:border-amber-400"
                        />
                        <button
                            onClick={clearFilters}
                            className="px-6 py-3 bg-gray-200 dark:bg-white/10 text-[#0d191b] dark:text-white font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-white/20 transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                            Clear All
                        </button>
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Status Filter */}
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-[#0d191b] dark:text-white focus:outline-none focus:border-amber-400"
                            >
                                <option value="all">All Users</option>
                                <option value="active">Active Only</option>
                                <option value="banned">Banned Only</option>
                            </select>
                        </div>

                        {/* Role Filter */}
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Role</label>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-[#0d191b] dark:text-white focus:outline-none focus:border-amber-400"
                            >
                                <option value="all">All Roles</option>
                                <option value="admin">Admins Only</option>
                                <option value="regular">Regular Users</option>
                            </select>
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-[#0d191b] dark:text-white focus:outline-none focus:border-amber-400"
                            >
                                <option value="name">Name (A-Z)</option>
                                <option value="email">Email (A-Z)</option>
                                <option value="date">Date Joined (Newest)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-[#0d191b] dark:text-white mb-1">{users.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
                </div>
                <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-green-500 mb-1">{users.filter(u => !u.isBanned).length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
                </div>
                <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-red-500 mb-1">{users.filter(u => u.isBanned).length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Banned Users</div>
                </div>
                <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-blue-500 mb-1">{filteredUsers.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Filtered Results</div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-white/5 border-b-2 border-gray-200 dark:border-white/10">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 dark:text-gray-400">User</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 dark:text-gray-400">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 dark:text-gray-400">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 dark:text-gray-400">Role</th>
                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-600 dark:text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No users found matching your filters
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.photoURL || 'https://via.placeholder.com/40'}
                                                    alt={user.displayName}
                                                    className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-white/10"
                                                />
                                                <div>
                                                    <p className="font-semibold text-[#0d191b] dark:text-white">{user.displayName}</p>
                                                    <button
                                                        onClick={() => openProfileModal(user)}
                                                        className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                                                    >
                                                        View Profile
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.isBanned ? (
                                                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-xs font-bold">
                                                    Banned
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs font-bold">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.isAdmin && (
                                                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold">
                                                    Admin
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 justify-end">
                                                {!user.isBanned ? (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setIsBanModalOpen(true);
                                                        }}
                                                        className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                                                    >
                                                        Ban
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUnbanUser(user)}
                                                        className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-semibold hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                                                    >
                                                        Unban
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleToggleAdmin(user)}
                                                    className="px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-colors"
                                                >
                                                    {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ban Modal */}
            {isBanModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-[#0d191b] dark:text-white mb-4">
                            Ban User: {selectedUser?.displayName}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Please provide a reason for banning this user:
                        </p>
                        <textarea
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            placeholder="Reason for ban..."
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-[#0d191b] dark:text-white focus:outline-none focus:border-amber-400 mb-4"
                            rows={4}
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setIsBanModalOpen(false);
                                    setBanReason('');
                                    setSelectedUser(null);
                                }}
                                className="px-6 py-3 bg-gray-200 dark:bg-white/10 text-[#0d191b] dark:text-white font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBanUser}
                                className="px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
                            >
                                Ban User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Profile Modal */}
            {isProfileModalOpen && selectedUser && (
                <UserProfileModal
                    user={selectedUser}
                    onClose={() => {
                        setIsProfileModalOpen(false);
                        setSelectedUser(null);
                    }}
                    onUpdate={loadUsers}
                />
            )}
        </AdminLayout>
    );
};

export default UserManagement;
