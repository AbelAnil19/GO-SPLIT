import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';
import { doc, getDoc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import AddExpenseModal from '../components/AddExpenseModal';
import AddMemberModal from '../components/AddMemberModal';
import GroupIconPicker from '../components/GroupIconPicker';
import ColorPicker from '../components/ColorPicker';
import { useTranslation } from 'react-i18next';
import { deleteExpense, sendMessage, listenToGroupMessages, getUserDocument, removeMemberFromGroup, leaveGroup, deleteGroup, updateGroupCustomization } from '../firebase/firestore';
import ConfirmationModal from '../components/ConfirmationModal';
import SmartSettlementModal from '../components/SmartSettlementModal';
import ReceiptViewer from '../components/ReceiptViewer';
import { useCurrency } from '../context/CurrencyContext';
import TwoFactorPromptModal from '../components/TwoFactorPromptModal';

const GroupDetailsPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const { addToast } = useToast();
    const { formatAmount } = useCurrency();

    const [group, setGroup] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, expense: null });
    const [removeMemberModal, setRemoveMemberModal] = useState({ isOpen: false, member: null });
    const [leaveGroupModal, setLeaveGroupModal] = useState(false);
    const [deleteGroupModal, setDeleteGroupModal] = useState(false);
    const [activeTab, setActiveTab] = useState('expenses'); // 'expenses', 'members', 'settlements', 'chat'
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [memberAvatars, setMemberAvatars] = useState({}); //Map userId to fresh photoURL
    const messagesEndRef = useRef(null);
    const isLeavingRef = useRef(false); // Track if user is voluntarily leaving

    // Customization states
    const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [customIcon, setCustomIcon] = useState('💰');
    const [customColor, setCustomColor] = useState('#F59E0B');
    const [customDescription, setCustomDescription] = useState('');
    const [customCategory, setCustomCategory] = useState('Other');
    const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

    // 2FA States
    const [is2FAPromptOpen, setIs2FAPromptOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // { type: 'remove_member' | 'delete_group' }

    // Fetch group details
    useEffect(() => {
        if (!groupId) return;

        const groupRef = doc(db, 'groups', groupId);
        const unsubscribe = onSnapshot(groupRef, (snapshot) => {
            if (snapshot.exists()) {
                const groupData = { id: snapshot.id, ...snapshot.data() };

                // ACCESS CONTROL: Check if current user is a member
                const isMember = groupData.members?.some(m => m.userId === currentUser.uid);
                if (!isMember) {
                    if (!isLeavingRef.current) {
                        addToast(t('groups.noAccess'), 'error');
                    }
                    navigate('/dashboard/groups');
                    return;
                }

                setGroup(groupData);
            } else {
                addToast(t('groups.groupNotFound'), 'error');
                navigate('/dashboard/groups');
            }
            setLoading(false);
        }, (error) => {
            console.error('Error fetching group:', error);
            addToast(t('groups.failedLoadGroup'), 'error');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [groupId, navigate, addToast]);

    // Fetch group expenses
    useEffect(() => {
        if (!groupId) return;

        const q = query(
            collection(db, 'expenses'),
            where('groupId', '==', groupId)
            // orderBy('date', 'desc') // Temporarily removed - requires composite index
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const expensesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setExpenses(expensesData);
        }, (error) => {
            console.error('Error fetching expenses:', error);
            addToast(t('groups.failedLoadExpenses'), 'error');
        });

        return () => unsubscribe();
    }, [groupId, addToast]);

    // Listen to group messages
    useEffect(() => {
        if (!groupId || activeTab !== 'chat') return;
        const unsubscribe = listenToGroupMessages(groupId, (msgs) => {
            setMessages(msgs);
        });
        return () => unsubscribe();
    }, [groupId, activeTab]);

    // Fetch fresh avatars for all group members
    useEffect(() => {
        const fetchMemberAvatars = async () => {
            if (!group?.members) return;

            const avatarPromises = group.members.map(async (member) => {
                try {
                    const userData = await getUserDocument(member.userId);
                    return {
                        userId: member.userId,
                        photoURL: userData?.photoURL || member.photoURL
                    };
                } catch (error) {
                    console.error(`Error fetching avatar for ${member.userId}:`, error);
                    return { userId: member.userId, photoURL: member.photoURL };
                }
            });

            const avatars = await Promise.all(avatarPromises);
            const avatarMap = {};
            avatars.forEach(({ userId, photoURL }) => {
                avatarMap[userId] = photoURL;
            });
            setMemberAvatars(avatarMap);
        };

        fetchMemberAvatars();
    }, [group?.members]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Calculate member balances
    const calculateBalances = () => {
        if (!group || !expenses.length) return {};

        const balances = {};

        // Initialize balances for all members
        group.members?.forEach(member => {
            balances[member.userId] = {
                name: member.name,
                photoURL: member.photoURL,
                balance: 0,
                paid: 0,
                owes: 0
            };
        });

        // Calculate from expenses
        expenses.forEach(expense => {
            const paidBy = expense.paidBy;
            const amount = expense.amount;
            const splitCount = expense.splitBetween?.length || 1;
            const shareAmount = amount / splitCount;

            // Add to payer's paid amount
            if (balances[paidBy]) {
                balances[paidBy].paid += amount;
            }

            // Deduct share from each person
            expense.splitBetween?.forEach(split => {
                if (balances[split.userId]) {
                    balances[split.userId].owes += shareAmount;
                }
            });
        });

        // Calculate net balance (positive = owed, negative = owes)
        Object.keys(balances).forEach(userId => {
            balances[userId].balance = balances[userId].paid - balances[userId].owes;
        });

        return balances;
    };

    // Calculate settlements
    const calculateSettlements = () => {
        const balances = calculateBalances();
        const settlements = [];

        // Separate creditors and debtors
        const creditors = [];
        const debtors = [];

        Object.entries(balances).forEach(([userId, data]) => {
            if (data.balance > 0.01) {
                creditors.push({ userId, name: data.name, amount: data.balance });
            } else if (data.balance < -0.01) {
                debtors.push({ userId, name: data.name, amount: Math.abs(data.balance) });
            }
        });

        // Greedy algorithm to minimize transactions
        let i = 0, j = 0;
        while (i < creditors.length && j < debtors.length) {
            const creditor = creditors[i];
            const debtor = debtors[j];
            const amount = Math.min(creditor.amount, debtor.amount);

            settlements.push({
                from: debtor.name,
                to: creditor.name,
                amount: amount
            });

            creditor.amount -= amount;
            debtor.amount -= amount;

            if (creditor.amount < 0.01) i++;
            if (debtor.amount < 0.01) j++;
        }

        return settlements;
    };

    const confirmDeleteExpense = async () => {
        if (!deleteModal.expense) return;

        try {
            await deleteExpense(deleteModal.expense.id, deleteModal.expense.groupId, deleteModal.expense.amount);
            addToast(t('groups.expenseDeleted'), 'success');
        } catch (error) {
            console.error('Error deleting expense:', error);
            addToast(t('groups.failedDeleteExpense'), 'error');
        }
    };

    const confirmRemoveMember = async () => {
        if (!removeMemberModal.member) return;

        try {
            const userData = await getUserDocument(currentUser.uid);
            if (userData?.is2FAEnabled) {
                setPendingAction({ type: 'remove_member' });
                setIs2FAPromptOpen(true);
                return;
            }
            await executeRemoveMember();
        } catch (error) {
            console.error('Error preparing to remove member:', error);
            addToast('Failed to prepare member removal', 'error');
        }
    };

    const executeRemoveMember = async () => {
        try {
            await removeMemberFromGroup(groupId, removeMemberModal.member.userId, currentUser.uid);
            addToast(`${removeMemberModal.member.name} ${t('groups.memberRemoved')}`, 'success');
            setRemoveMemberModal({ isOpen: false, member: null });

            // Clear pending states
            setPendingAction(null);
            setIs2FAPromptOpen(false);
        } catch (error) {
            console.error('Error removing member:', error);
            addToast(error.message || t('groups.failedRemoveMember'), 'error');
        }
    };

    const handleLeaveGroup = async () => {
        try {
            isLeavingRef.current = true; // Set flag to suppress access error
            await leaveGroup(groupId, currentUser.uid);
            addToast(`${t('groups.youLeft')} ${group.name}`, 'success');
            navigate('/dashboard/groups');
        } catch (error) {
            console.error('Error leaving group:', error);
            addToast(error.message || t('groups.failedLeaveGroup'), 'error');
            isLeavingRef.current = false; // Reset on error
        }
    };

    const handleDeleteGroup = async () => {
        try {
            const userData = await getUserDocument(currentUser.uid);
            if (userData?.is2FAEnabled) {
                setPendingAction({ type: 'delete_group' });
                setIs2FAPromptOpen(true);
                return;
            }
            await executeDeleteGroup();
        } catch (error) {
            console.error('Error preparing to delete group:', error);
            addToast('Failed to prepare group deletion', 'error');
        }
    };

    const executeDeleteGroup = async () => {
        try {
            isLeavingRef.current = true; // Suppress access error since group is gone
            await deleteGroup(groupId, currentUser.uid);
            addToast(t('groups.groupDeleted'), 'success');
            navigate('/dashboard/groups');
        } catch (error) {
            console.error('Error deleting group:', error);
            addToast(t('groups.failedDeleteGroup'), 'error');
            isLeavingRef.current = false;
        }
    };


    const getCategoryStyle = (category) => {
        const styles = {
            food: { icon: 'restaurant', color: 'emerald' },
            travel: { icon: 'flight', color: 'blue' },
            shopping: { icon: 'shopping_bag', color: 'purple' },
            entertainment: { icon: 'movie', color: 'pink' },
            bills: { icon: 'receipt_long', color: 'orange' },
            other: { icon: 'category', color: 'gray' }
        };
        return styles[category] || styles.other;
    };

    // Load customization data when group loads
    useEffect(() => {
        if (group?.customization) {
            setCustomIcon(group.customization.icon || '💰');
            setCustomColor(group.customization.color || '#F59E0B');
            setCustomDescription(group.customization.description || '');
            setCustomCategory(group.customization.category || 'Other');
        }
    }, [group]);

    const handleSaveCustomization = async () => {
        try {
            await updateGroupCustomization(groupId, currentUser.uid, {
                icon: customIcon,
                color: customColor,
                description: customDescription,
                category: customCategory
            });
            addToast(t('groups.customizationUpdated'), 'success');
            setIsCustomizationOpen(false);
        } catch (error) {
            console.error('Error updating customization:', error);
            addToast(error.message || t('groups.failedUpdateCustomization'), 'error');
        }
    };

    const handleIconSelect = (icon) => {
        setCustomIcon(icon);
        setIsIconPickerOpen(false);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        try {
            await sendMessage(groupId, newMessage.trim(), currentUser);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            addToast(t('groups.failedSendMessage'), 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
                    <p className="text-gray-400">{t('groups.loadingGroupDetail')}</p>
                </div>
            </div>
        );
    }

    if (!group) {
        return null;
    }

    const balances = calculateBalances();
    const settlements = calculateSettlements();
    const isAdmin = group.createdBy === currentUser.uid;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/dashboard/groups')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    {t('groups.backToGroups')}
                </button>

                <div className="bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] rounded-2xl p-4 md:p-6 border-2 border-gray-200 dark:border-white/10 shadow-md dark:shadow-none backdrop-blur-[2px]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div
                                className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0"
                                style={{
                                    background: `linear-gradient(135deg, ${customColor}, ${customColor}dd)`
                                }}
                            >
                                <span className="text-2xl md:text-4xl">{customIcon}</span>
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">{group.name}</h1>
                                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{group.members?.length || 0} {t('dashboard.members')} · {formatAmount(group.totalExpenses || 0)} {t('dashboard.total')}</p>
                                {customDescription && (
                                    <p className="text-[10px] md:text-sm text-gray-600 dark:text-gray-400 mt-0.5 md:mt-1 italic line-clamp-2">"{customDescription}"</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0">
                            <button
                                onClick={() => setIsAddExpenseOpen(true)}
                                className="col-span-2 md:col-span-1 flex-1 md:flex-none px-3 md:px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-black rounded-xl font-semibold transition-colors flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base border border-amber-500/20"
                            >
                                <span className="material-symbols-outlined text-lg md:text-xl">add</span>
                                {t('groups.addExpense')}
                            </button>
                            <button
                                onClick={() => setIsAddMemberOpen(true)}
                                className="px-3 md:px-4 py-2 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 backdrop-blur-[2px] text-sm"
                            >
                                <span className="material-symbols-outlined text-[18px]">person_add</span>
                                <span className="hidden sm:inline">{t('groups.addMember')}</span>
                            </button>
                            {!isAdmin && (
                                <button
                                    onClick={() => setLeaveGroupModal(true)}
                                    className="px-3 md:px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border border-red-500/20 backdrop-blur-[2px] text-sm"
                                    title={t('groups.leaveGroupTitle')}
                                >
                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                    {t('groups.leaveGroupTitle').split(' ')[0]}
                                </button>
                            )}
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={() => setIsCustomizationOpen(true)}
                                        className="px-3 md:px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border border-purple-500/20 backdrop-blur-[2px] text-sm"
                                        title={t('groups.customize')}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">palette</span>
                                        {t('groups.customize')}
                                    </button>
                                    <button
                                        onClick={() => setDeleteGroupModal(true)}
                                        className="px-3 md:px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border border-red-500/20 backdrop-blur-[2px] text-sm"
                                        title={t('common.delete')}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                        {t('common.delete')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-white/10">
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${activeTab === 'expenses'
                        ? 'border-amber-400 text-amber-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    {t('groups.expensesTab')} ({expenses.length})
                </button>
                <button
                    onClick={() => setActiveTab('members')}
                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${activeTab === 'members'
                        ? 'border-amber-400 text-amber-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    {t('groups.membersTab')} ({group.members?.length || 0})
                </button>
                <button
                    onClick={() => setActiveTab('settlements')}
                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${activeTab === 'settlements'
                        ? 'border-amber-400 text-amber-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    {t('groups.settlementsTab')} ({settlements.length})
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${activeTab === 'chat'
                        ? 'border-amber-400 text-amber-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    {t('groups.chatTab')} {messages.length > 0 && `(${messages.length})`}
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'expenses' && (
                <div className="space-y-6">
                    {expenses.length === 0 ? (
                        <div className="text-center py-16 bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] rounded-2xl border-2 border-gray-200 dark:border-white/10 shadow-md dark:shadow-none backdrop-blur-[2px]">
                            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">receipt_long</span>
                            <p className="text-gray-500 dark:text-gray-400">{t('groups.noExpensesYet')}</p>
                            <button
                                onClick={() => setIsAddExpenseOpen(true)}
                                className="mt-4 px-6 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-xl font-semibold transition-colors"
                            >
                                {t('groups.addFirstExpense')}
                            </button>
                        </div>
                    ) : (
                        expenses.map((expense) => {
                            const categoryStyle = getCategoryStyle(expense.category);
                            const payer = group.members?.find(m => m.userId === expense.paidBy);

                            return (
                                <div key={expense.id} className="group bg-white/20 dark:bg-white/[0.05] rounded-xl p-4 border border-gray-200/40 dark:border-white/10 hover:border-amber-400/50 transition-all backdrop-blur-sm">

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start sm:items-center gap-4 flex-1">
                                            <div className={`w-12 h-12 rounded-xl bg-${categoryStyle.color}-500/10 flex items-center justify-center shrink-0`}>
                                                <span className={`material-symbols-outlined text-${categoryStyle.color}-500`}>{categoryStyle.icon}</span>
                                            </div>

                                            <div className="flex-1 w-full min-w-0 pr-4 sm:pr-0">
                                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{expense.description}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 sm:line-clamp-none">
                                                    {t('groups.paidBy')} {payer?.name || t('groups.unknown')} · {new Date(expense.date?.seconds * 1000).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-gray-200/40 dark:border-white/10 sm:border-0">
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{formatAmount(expense.amount, expense.currency || 'INR')}</span>
                                            {expense.paidBy === currentUser.uid && (
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, expense })}
                                                    className="sm:opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Receipt Viewer */}
                                    {expense.receipt && (
                                        <div className="mt-3 border-t border-gray-200/40 dark:border-white/10 pt-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-sm text-amber-500">receipt_long</span>
                                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                                    {t('groups.receiptAttached')}
                                                </span>
                                            </div>
                                            <ReceiptViewer receipt={expense.receipt} />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {activeTab === 'members' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.members?.map((member) => {
                        const balance = balances[member.userId]?.balance || 0;
                        const isPositive = balance > 0;

                        return (
                            <div key={member.userId} className="relative bg-white/60 dark:bg-[#1a1c23]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-3xl p-4 sm:p-6 hover:border-amber-500/30 dark:hover:border-amber-500/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 group flex flex-col justify-between">
                                <div className="flex items-start justify-between mb-4 sm:mb-8">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="relative">
                                            {(memberAvatars[member.userId] || member.photoURL) ? (
                                                <img
                                                    src={memberAvatars[member.userId] || member.photoURL}
                                                    alt={member.name}
                                                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white dark:border-[#14161b] shadow-lg group-hover:border-amber-400 transition-colors"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                                                    {member.name?.charAt(0)}
                                                </div>
                                            )}
                                            {member.role === 'admin' && (
                                                <div className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 w-5 h-5 sm:w-7 sm:h-7 bg-amber-500 rounded-full border-[2px] sm:border-[3px] border-white dark:border-[#1a1c23] flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform" title={t('groups.admin')}>
                                                    <span className="material-symbols-outlined text-[10px] sm:text-[14px] text-white">star</span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-base sm:text-lg text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors line-clamp-1">{member.name}</h3>
                                            <p className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{member.role === 'admin' ? t('groups.admin') : t('groups.member')}</p>
                                        </div>
                                    </div>
                                    {isAdmin && member.userId !== currentUser.uid && (
                                        <button
                                            onClick={() => setRemoveMemberModal({ isOpen: true, member })}
                                            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all sm:opacity-0 group-hover:opacity-100 -mr-1 -mt-1 sm:-mr-2 sm:-mt-2"
                                            title={`${t('groups.remove')} ${member.name}`}
                                        >
                                            <span className="material-symbols-outlined text-lg sm:text-xl">person_remove</span>
                                        </button>
                                    )}
                                </div>

                                <div className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border ${Math.abs(balance) < 0.01
                                    ? 'bg-gray-50/80 dark:bg-white/5 border-gray-200/50 dark:border-white/5'
                                    : isPositive
                                        ? 'bg-green-50/80 dark:bg-green-500/5 border-green-200/50 dark:border-green-500/10'
                                        : 'bg-red-50/80 dark:bg-red-500/5 border-red-200/50 dark:border-red-500/10'
                                    }`}>
                                    {Math.abs(balance) >= 0.01 && (
                                        <div className={`absolute -right-6 -top-6 w-24 h-24 sm:w-32 sm:h-32 rounded-full blur-2xl sm:blur-3xl opacity-20 ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    )}
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-0.5 sm:mb-1 ${Math.abs(balance) < 0.01 ? 'text-gray-500 dark:text-gray-400' : isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {Math.abs(balance) < 0.01 ? t('groups.status') : isPositive ? t('groups.getsBack') : t('groups.owes')}
                                            </span>
                                            <span className={`font-black tracking-tight ${Math.abs(balance) < 0.01
                                                ? 'text-gray-900 dark:text-white text-base sm:text-lg'
                                                : isPositive
                                                    ? 'text-green-600 dark:text-green-400 text-xl sm:text-2xl'
                                                    : 'text-red-600 dark:text-red-400 text-xl sm:text-2xl'
                                                }`}>
                                                {Math.abs(balance) < 0.01 ? t('groups.settledUp') : formatAmount(Math.abs(balance))}
                                            </span>
                                        </div>
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${Math.abs(balance) < 0.01
                                            ? 'bg-gray-200/50 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                                            : isPositive
                                                ? 'bg-green-100/50 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20'
                                                : 'bg-red-100/50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                                            }`}>
                                            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">
                                                {Math.abs(balance) < 0.01 ? 'done_all' : isPositive ? 'call_received' : 'call_made'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'settlements' && (
                <div className="space-y-6">
                    {/* Header Controls */}
                    {settlements.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 shadow-lg shadow-amber-500/5 backdrop-blur-md">
                            <div className="flex gap-3 sm:gap-4 items-center">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <span className="material-symbols-outlined text-white text-xl sm:text-2xl">route</span>
                                </div>
                                <div className="text-sm">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-0.5">{t('groups.optimalSettlement')}</h3>
                                    <p className="text-[11px] sm:text-sm text-amber-600 dark:text-amber-400/80 font-medium leading-tight">{t('groups.completeTransactions').replace('{count}', settlements.length)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsSettlementModalOpen(true)}
                                className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base"
                            >
                                <span className="material-symbols-outlined text-[18px] sm:text-[24px]">auto_awesome</span>
                                {t('groups.smartOptimizer')}
                            </button>
                        </div>
                    )}

                    {/* Content Area */}
                    {settlements.length === 0 ? (
                        <div className="text-center py-20 bg-gradient-to-br from-white/40 to-white/10 dark:from-white/[0.05] dark:to-white/[0.01] rounded-3xl border border-gray-200/50 dark:border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-green-500/5 dark:bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-tr from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30 animate-pulse">
                                    <span className="material-symbols-outlined text-5xl text-white">task_alt</span>
                                </div>
                                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-2">{t('groups.settledUpTitle')}</h3>
                                <p className="text-gray-500 dark:text-gray-400 font-medium max-w-sm">{t('groups.settledUpMsg')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {settlements.map((settlement, index) => (
                                <div key={index} className="relative bg-white/60 dark:bg-[#1a1c23]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-2xl p-4 sm:p-5 hover:border-amber-500/30 dark:hover:border-amber-500/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 group flex flex-col sm:flex-row items-center gap-4 sm:gap-6">

                                    {/* Payer */}
                                    <div className="flex-1 flex items-center justify-end sm:justify-start gap-3 sm:gap-4 w-full sm:w-auto">
                                        <div className="text-right sm:text-left flex-1">
                                            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">{t('groups.payer')}</p>
                                            <p className="font-black text-base sm:text-lg text-gray-900 dark:text-white truncate">{settlement.from}</p>
                                        </div>
                                        <div className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/30 flex items-center justify-center text-red-500 font-black text-lg sm:text-xl shadow-inner relative mt-1 sm:mt-0">
                                            {settlement.from.charAt(0)}
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full border-2 border-white dark:border-[#1a1c23]"></div>
                                        </div>
                                    </div>

                                    {/* Connection Graphics */}
                                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-full sm:w-auto py-2 sm:py-0">
                                        <p className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500 mb-1">
                                            {formatAmount(settlement.amount)}
                                        </p>
                                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-32 justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                                            <div className="h-[2px] w-full bg-gradient-to-r from-red-500/20 via-amber-500 to-green-500/20 rounded-full"></div>
                                            <span className="material-symbols-outlined text-amber-500 absolute bg-white dark:bg-[#1a1c23] rounded-full text-sm sm:text-base">chevron_right</span>
                                        </div>
                                    </div>

                                    {/* Payee */}
                                    <div className="flex-1 flex items-center justify-start sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto flex-row-reverse sm:flex-row">
                                        <div className="text-left sm:text-right flex-1">
                                            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">{t('groups.receiver')}</p>
                                            <p className="font-black text-base sm:text-lg text-gray-900 dark:text-white truncate">{settlement.to}</p>
                                        </div>
                                        <div className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/10 border-2 border-green-500/30 flex items-center justify-center text-green-500 font-black text-lg sm:text-xl shadow-inner relative mb-1 sm:mb-0">
                                            {settlement.to.charAt(0)}
                                            <div className="absolute -bottom-1 -left-1 sm:-left-auto sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white dark:border-[#1a1c23]"></div>
                                        </div>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] rounded-2xl border-2 border-gray-200 dark:border-white/10 flex flex-col shadow-md dark:shadow-none backdrop-blur-[2px] h-[70vh] min-h-[400px] max-h-[800px]">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <span className="material-symbols-outlined text-5xl sm:text-6xl text-gray-300 dark:text-gray-600 mb-3 sm:mb-4">chat_bubble</span>
                                <p className="text-gray-500 dark:text-gray-400 font-semibold text-sm sm:text-base">{t('groups.noMessages')}</p>
                                <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">{t('groups.startConversation')}</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isMyMessage = msg.senderId === currentUser.uid;
                                const messageTime = msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                                return (
                                    <div key={msg.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} gap-3`}>
                                        {!isMyMessage && (
                                            <div className="flex-shrink-0">
                                                {(memberAvatars[msg.senderId] || msg.senderPhoto) ? (
                                                    <img src={memberAvatars[msg.senderId] || msg.senderPhoto} alt={msg.senderName} className="w-8 h-8 rounded-full" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-black font-bold text-sm">
                                                        {msg.senderName?.charAt(0) || 'U'}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                            {!isMyMessage && (
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{msg.senderName}</span>
                                            )}
                                            <div className={`px-4 py-2 rounded-2xl ${isMyMessage
                                                ? 'bg-amber-400 text-black'
                                                : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white'
                                                }`}>
                                                <p className="text-sm break-words">{msg.text}</p>
                                            </div>
                                            <span className="text-xs text-gray-400 mt-1">{messageTime}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-200 dark:border-white/10 p-3 sm:p-4 bg-white/50 dark:bg-[#1a1c23]/50 rounded-b-2xl">
                        <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={t('groups.typeMessage')}
                                className="flex-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl font-bold transition-all shadow-md active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-lg sm:text-xl">send</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modals */}
            <AddExpenseModal
                isOpen={isAddExpenseOpen}
                onClose={() => setIsAddExpenseOpen(false)}
                preselectedGroup={group}
            />

            <AddMemberModal
                isOpen={isAddMemberOpen}
                onClose={() => setIsAddMemberOpen(false)}
                groupId={group.id}
                groupName={group.name}
                currentMembers={group.members || []}
            />

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, expense: null })}
                onConfirm={confirmDeleteExpense}
                title={t('groups.deleteExpenseTitle')}
                message={`${t('groups.deleteExpenseMsg')} "${deleteModal.expense?.description}"${t('groups.deleteExpenseMsgEnd')}`}
                confirmText={t('common.delete')}
                type="danger"
            />

            <ConfirmationModal
                isOpen={removeMemberModal.isOpen}
                onClose={() => setRemoveMemberModal({ isOpen: false, member: null })}
                onConfirm={confirmRemoveMember}
                title={t('groups.removeMemberTitle')}
                message={`${t('groups.removeMemberMsg')} ${removeMemberModal.member?.name} ${t('groups.removeMemberMsgEnd')}`}
                confirmText={t('groups.remove')}
                type="danger"
            />

            <ConfirmationModal
                isOpen={deleteGroupModal}
                onClose={() => setDeleteGroupModal(false)}
                onConfirm={() => {
                    setDeleteGroupModal(false);
                    // trigger 2FA check instead of immediate execution
                    handleDeleteGroup(); // Now calls the wrapper function
                }}
                title={t('groups.deleteGroupTitle')}
                message={t('groups.deleteGroupMsg')} // Original message, assuming t('groups.deleteGroupConfirm') is not defined yet
                confirmText={t('groups.deleteGroupTitle')}
                type="danger"
            />

            <TwoFactorPromptModal
                isOpen={is2FAPromptOpen}
                onClose={() => {
                    setIs2FAPromptOpen(false);
                    setPendingAction(null);
                }}
                onVerifySuccess={() => {
                    if (pendingAction?.type === 'remove_member') {
                        executeRemoveMember();
                    } else if (pendingAction?.type === 'delete_group') {
                        executeDeleteGroup();
                    }
                }}
                actionName={pendingAction?.type === 'remove_member' ? t('groups.memberRemoved') : t('common.delete')}
            />

            <ConfirmationModal
                isOpen={leaveGroupModal}
                onClose={() => setLeaveGroupModal(false)}
                onConfirm={handleLeaveGroup}
                title={t('groups.leaveGroupTitle')}
                message={`${t('groups.leaveGroupMsg')} "${group.name}"${t('groups.leaveGroupMsgEnd')}`}
                confirmText={t('groups.leaveGroupTitle')}
                type="danger"
            />

            {/* Customization Modal */}
            {isCustomizationOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCustomizationOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#1a1c23] rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('groups.customizeGroupTitle')}</h2>
                            <button
                                onClick={() => setIsCustomizationOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Icon Picker */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('groups.groupIcon')}</label>
                                <button
                                    onClick={() => setIsIconPickerOpen(true)}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-between hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-4xl">{customIcon}</span>
                                        <span className="text-gray-700 dark:text-gray-300">{t('groups.clickToChangeIcon')}</span>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-500">chevron_right</span>
                                </button>
                            </div>

                            {/* Color Picker */}
                            <ColorPicker currentColor={customColor} onChange={setCustomColor} />

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('groups.descriptionOptional')}</label>
                                <textarea
                                    value={customDescription}
                                    onChange={(e) => setCustomDescription(e.target.value)}
                                    placeholder={t('groups.addDescriptionPlaceholder')}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    rows="3"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('groups.category')}</label>
                                <select
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-[#2a2d35] border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer [&>option]:bg-white dark:[&>option]:bg-[#2a2d35] [&>option]:text-gray-900 dark:[&>option]:text-white"
                                >
                                    <option value="Travel">{t('groups.catTravel')}</option>
                                    <option value="Roommates">{t('groups.catRoommates')}</option>
                                    <option value="Office">{t('groups.catOffice')}</option>
                                    <option value="Friends">{t('groups.catFriends')}</option>
                                    <option value="Family">{t('groups.catFamily')}</option>
                                    <option value="Other">{t('groups.catOther')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsCustomizationOpen(false)}
                                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleSaveCustomization}
                                className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-colors"
                            >
                                {t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Icon Picker Modal */}
            {isIconPickerOpen && (
                <GroupIconPicker
                    currentIcon={customIcon}
                    onSelect={handleIconSelect}
                    onClose={() => setIsIconPickerOpen(false)}
                />
            )}

            {/* Smart Settlement Modal */}
            <SmartSettlementModal
                isOpen={isSettlementModalOpen}
                onClose={() => setIsSettlementModalOpen(false)}
                expenses={expenses}
                members={group.members || []}
            />
        </div>
    );
};

export default GroupDetailsPage;
