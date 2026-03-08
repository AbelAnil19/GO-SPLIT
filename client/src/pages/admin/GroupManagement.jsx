import React, { useState, useEffect } from 'react';
import { getAllGroups, forceDeleteGroup } from '../../firebase/firestore';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/admin/AdminLayout';

const GroupManagement = () => {
    const { addToast } = useToast();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            const fetchedGroups = await getAllGroups();
            setGroups(fetchedGroups);
        } catch (error) {
            console.error('Error loading groups:', error);
            addToast('Failed to load groups', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGroup = async (groupId, groupName) => {
        if (!confirm(`Are you sure you want to permanently delete "${groupName}"? This will delete ALL expenses and settlements.`)) {
            return;
        }

        try {
            await forceDeleteGroup(groupId);
            addToast(`Group "${groupName}" deleted successfully`, 'success');
            loadGroups();
        } catch (error) {
            console.error('Error deleting group:', error);
            addToast('Failed to delete group', 'error');
        }
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
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-[#0d191b] dark:text-white mb-2">Group Management</h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Oversee all groups on the platform</p>
            </div>

            <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl p-4 md:p-6 mb-6">
                <div className="text-xl md:text-3xl font-bold text-[#0d191b] dark:text-white mb-1">{groups.length}</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total Groups</div>
            </div>

            <div className="bg-white dark:bg-[#1a1c23] border-2 border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-white/5 border-b-2 border-gray-200 dark:border-white/10">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 dark:text-gray-400">Group Name</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 dark:text-gray-400">Admin</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 dark:text-gray-400">Members</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 dark:text-gray-400">Status</th>
                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-600 dark:text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {groups.map((group) => (
                                <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-[#0d191b] dark:text-white">{group.name}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold">
                                                {group.members?.find?.(m => m.role === 'admin')?.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {group.members?.find?.(m => m.role === 'admin')?.name || 'Unknown'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{group.members?.length || 0} members</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {group.isSettled ? (
                                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-bold border border-gray-200 dark:border-gray-700">
                                                Closed
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                                                Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => handleDeleteGroup(group.id, group.name)}
                                                className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default GroupManagement;
