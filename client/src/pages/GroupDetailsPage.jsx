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
import { deleteExpense, sendMessage, listenToGroupMessages, getUserDocument, removeMemberFromGroup, leaveGroup, deleteGroup, updateGroupCustomization } from '../firebase/firestore';
import ConfirmationModal from '../components/ConfirmationModal';
import SmartSettlementModal from '../components/SmartSettlementModal';
import ReceiptViewer from '../components/ReceiptViewer';
import { useCurrency } from '../context/CurrencyContext';

const GroupDetailsPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
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
                    // Only show error if NOT voluntarily leaving
                    if (!isLeavingRef.current) {
                        addToast('You do not have access to this group', 'error');
                    }
                    navigate('/dashboard/groups');
                    return;
                }

                setGroup(groupData);
            } else {
                addToast('Group not found', 'error');
                navigate('/dashboard/groups');
            }
            setLoading(false);
        }, (error) => {
            console.error('Error fetching group:', error);
            addToast('Failed to load group', 'error');
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
            addToast('Failed to load expenses', 'error');
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
            addToast('Expense deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting expense:', error);
            addToast('Failed to delete expense', 'error');
        }
    };

    const confirmRemoveMember = async () => {
        if (!removeMemberModal.member) return;

        try {
            await removeMemberFromGroup(groupId, removeMemberModal.member.userId, currentUser.uid);
            addToast(`${removeMemberModal.member.name} removed from group`, 'success');
            setRemoveMemberModal({ isOpen: false, member: null });
        } catch (error) {
            console.error('Error removing member:', error);
            addToast(error.message || 'Failed to remove member', 'error');
        }
    };

    const handleLeaveGroup = async () => {
        try {
            isLeavingRef.current = true; // Set flag to suppress access error
            await leaveGroup(groupId, currentUser.uid);
            addToast(`You left ${group.name}`, 'success');
            navigate('/dashboard/groups');
        } catch (error) {
            console.error('Error leaving group:', error);
            addToast(error.message || 'Failed to leave group', 'error');
            isLeavingRef.current = false; // Reset on error
        }
    };

    const handleDeleteGroup = async () => {
        try {
            isLeavingRef.current = true; // Suppress access error since group is gone
            await deleteGroup(groupId, currentUser.uid);
            addToast('Group deleted successfully', 'success');
            navigate('/dashboard/groups');
        } catch (error) {
            console.error('Error deleting group:', error);
            addToast('Failed to delete group', 'error');
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
            addToast('Group customization updated!', 'success');
            setIsCustomizationOpen(false);
        } catch (error) {
            console.error('Error updating customization:', error);
            addToast(error.message || 'Failed to update customization', 'error');
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
            addToast('Failed to send message', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading group...</p>
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
                    Back to Groups
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
                                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{group.members?.length || 0} members · {formatAmount(group.totalExpenses || 0)} total</p>
                                {customDescription && (
                                    <p className="text-[10px] md:text-sm text-gray-600 dark:text-gray-400 mt-0.5 md:mt-1 italic line-clamp-2">"{customDescription}"</p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0">
                            <button
                                onClick={() => setIsAddExpenseOpen(true)}
                                className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-xl font-semibold transition-colors flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base"
                            >
                                <span className="material-symbols-outlined text-lg md:text-xl">add</span>
                                Add Expense
                            </button>
                            <button
                                onClick={() => setIsAddMemberOpen(true)}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-xl font-semibold transition-colors flex items-center gap-2 border-2 border-gray-200 dark:border-white/10 backdrop-blur-[2px]"
                            >
                                <span className="material-symbols-outlined text-xl">person_add</span>
                                Add Member
                            </button>
                            {!isAdmin && (
                                <button
                                    onClick={() => setLeaveGroupModal(true)}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-semibold transition-colors flex items-center gap-2 border-2 border-red-500/20 backdrop-blur-[2px]"
                                    title="Leave Group"
                                >
                                    <span className="material-symbols-outlined text-xl">logout</span>
                                    Leave
                                </button>
                            )}
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={() => setIsCustomizationOpen(true)}
                                        className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-xl font-semibold transition-colors flex items-center gap-2 border-2 border-purple-500/20 backdrop-blur-[2px]"
                                        title="Customize Group"
                                    >
                                        <span className="material-symbols-outlined text-xl">palette</span>
                                        Customize
                                    </button>
                                    <button
                                        onClick={() => setDeleteGroupModal(true)}
                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-semibold transition-colors flex items-center gap-2 border-2 border-red-500/20 backdrop-blur-[2px]"
                                        title="Delete Group"
                                    >
                                        <span className="material-symbols-outlined text-xl">delete</span>
                                        Delete
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
                    Expenses ({expenses.length})
                </button>
                <button
                    onClick={() => setActiveTab('members')}
                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${activeTab === 'members'
                        ? 'border-amber-400 text-amber-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Members ({group.members?.length || 0})
                </button>
                <button
                    onClick={() => setActiveTab('settlements')}
                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${activeTab === 'settlements'
                        ? 'border-amber-400 text-amber-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Settlements ({settlements.length})
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${activeTab === 'chat'
                        ? 'border-amber-400 text-amber-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Chat {messages.length > 0 && `(${messages.length})`}
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'expenses' && (
                <div className="space-y-6">
                    {expenses.length === 0 ? (
                        <div className="text-center py-16 bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] rounded-2xl border-2 border-gray-200 dark:border-white/10 shadow-md dark:shadow-none backdrop-blur-[2px]">
                            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">receipt_long</span>
                            <p className="text-gray-500 dark:text-gray-400">No expenses yet</p>
                            <button
                                onClick={() => setIsAddExpenseOpen(true)}
                                className="mt-4 px-6 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-xl font-semibold transition-colors"
                            >
                                Add First Expense
                            </button>
                        </div>
                    ) : (
                        expenses.map((expense) => {
                            const categoryStyle = getCategoryStyle(expense.category);
                            const payer = group.members?.find(m => m.userId === expense.paidBy);

                            return (
                                <div key={expense.id} className="group bg-white/20 dark:bg-white/[0.05] rounded-xl p-4 border border-gray-200/40 dark:border-white/10 hover:border-amber-400/50 transition-all backdrop-blur-sm">

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`w-12 h-12 rounded-xl bg-${categoryStyle.color}-500/10 flex items-center justify-center`}>
                                                <span className={`material-symbols-outlined text-${categoryStyle.color}-500`}>{categoryStyle.icon}</span>
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{expense.description}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Paid by {payer?.name || 'Unknown'} · {new Date(expense.date?.seconds * 1000).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{formatAmount(expense.amount, expense.currency || 'INR')}</span>
                                            {expense.paidBy === currentUser.uid && (
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, expense })}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-xl">delete</span>
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
                                                    Receipt Attached
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.members?.map((member) => {
                        const balance = balances[member.userId]?.balance || 0;
                        const isPositive = balance > 0;

                        return (
                            <div key={member.userId} className="bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] rounded-xl p-6 border-2 border-gray-200 dark:border-white/10 shadow-md dark:shadow-none backdrop-blur-[2px]">
                                <div className="flex items-center gap-4 mb-4">
                                    {(memberAvatars[member.userId] || member.photoURL) ? (
                                        <img
                                            src={memberAvatars[member.userId] || member.photoURL}
                                            alt={member.name}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-amber-400"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-black font-bold text-lg">
                                            {member.name?.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {member.role === 'admin' ? '👑 Admin' : 'Member'}
                                        </p>
                                    </div>
                                    {/* Remove button - only show if current user is admin and member is not current user */}
                                    {isAdmin && member.userId !== currentUser.uid && (
                                        <button
                                            onClick={() => setRemoveMemberModal({ isOpen: true, member })}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                            title={`Remove ${member.name}`}
                                        >
                                            <span className="material-symbols-outlined text-xl">person_remove</span>
                                        </button>
                                    )}
                                </div>
                                <div className={`text-center p-3 rounded-lg ${Math.abs(balance) < 0.01
                                    ? 'bg-green-500/10 text-green-500'
                                    : isPositive
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'bg-red-500/10 text-red-500'
                                    }`}>
                                    {Math.abs(balance) < 0.01 ? (
                                        <span className="text-sm font-semibold">Settled up</span>
                                    ) : isPositive ? (
                                        <span className="text-sm font-semibold">Gets back {formatAmount(Math.abs(balance))}</span>
                                    ) : (
                                        <span className="text-sm font-semibold">Owes {formatAmount(Math.abs(balance))}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'settlements' && (
                <div className="space-y-4">
                    {settlements.length === 0 ? (
                        <div className="text-center py-16 bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] rounded-2xl border-2 border-gray-200 dark:border-white/10 shadow-md dark:shadow-none backdrop-blur-[2px]">
                            <span className="material-symbols-outlined text-6xl text-green-500 mb-4">check_circle</span>
                            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">All Settled!</p>
                            <p className="text-gray-500 dark:text-gray-400">Everyone is paid up. No settlements needed.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <span className="material-symbols-outlined text-amber-400">lightbulb</span>
                                        <div className="text-sm text-amber-300">
                                            <p className="font-semibold mb-1">Suggested Settlement Plan</p>
                                            <p>Complete these {settlements.length} transactions to settle all debts in the group.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsSettlementModalOpen(true)}
                                        className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-xl font-semibold transition-colors flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">calculate</span>
                                        Optimize
                                    </button>
                                </div>
                            </div>
                            {settlements.map((settlement, index) => (
                                <div key={index} className="bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] rounded-xl p-6 border-2 border-gray-200 dark:border-white/10 shadow-md dark:shadow-none backdrop-blur-[2px]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold">
                                                {settlement.from.charAt(0)}
                                            </div>
                                            <span className="material-symbols-outlined text-gray-400">arrow_forward</span>
                                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold">
                                                {settlement.to.charAt(0)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                <span className="font-semibold text-gray-900 dark:text-white">{settlement.from}</span> pays <span className="font-semibold text-gray-900 dark:text-white">{settlement.to}</span>
                                            </p>
                                            <p className="text-2xl font-bold text-amber-400">{formatAmount(settlement.amount)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] rounded-2xl border-2 border-gray-200 dark:border-white/10 flex flex-col shadow-md dark:shadow-none backdrop-blur-[2px]" style={{ height: '500px' }}>
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">chat_bubble</span>
                                <p className="text-gray-500 dark:text-gray-400 font-semibold">No messages yet</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500">Start the conversation!</p>
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
                    <div className="border-t border-gray-200 dark:border-white/10 p-4">
                        <form onSubmit={handleSendMessage} className="flex gap-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-amber-400 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-black rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">send</span>
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
                title="Delete Expense"
                message={`Are you sure you want to delete "${deleteModal.expense?.description}"? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />

            <ConfirmationModal
                isOpen={removeMemberModal.isOpen}
                onClose={() => setRemoveMemberModal({ isOpen: false, member: null })}
                onConfirm={confirmRemoveMember}
                title="Remove Member"
                message={`Are you sure you want to remove ${removeMemberModal.member?.name} from this group? They will no longer have access to group expenses and chat.`}
                confirmText="Remove"
                type="danger"
            />

            <ConfirmationModal
                isOpen={deleteGroupModal}
                onClose={() => setDeleteGroupModal(false)}
                onConfirm={handleDeleteGroup}
                title="Delete Group"
                message="Are you sure you want to delete this group? ALL expenses and data will be permanently lost! This action cannot be undone."
                confirmText="Delete Group"
                type="danger"
            />

            <ConfirmationModal
                isOpen={leaveGroupModal}
                onClose={() => setLeaveGroupModal(false)}
                onConfirm={handleLeaveGroup}
                title="Leave Group"
                message={`Are you sure you want to leave "${group.name}"? You will lose access to all expenses and history.`}
                confirmText="Leave Group"
                type="danger"
            />

            {/* Customization Modal */}
            {isCustomizationOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCustomizationOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#1a1c23] rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customize Group</h2>
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Group Icon</label>
                                <button
                                    onClick={() => setIsIconPickerOpen(true)}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-between hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-4xl">{customIcon}</span>
                                        <span className="text-gray-700 dark:text-gray-300">Click to change icon</span>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-500">chevron_right</span>
                                </button>
                            </div>

                            {/* Color Picker */}
                            <ColorPicker currentColor={customColor} onChange={setCustomColor} />

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
                                <textarea
                                    value={customDescription}
                                    onChange={(e) => setCustomDescription(e.target.value)}
                                    placeholder="Add a description for your group..."
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    rows="3"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                <select
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-[#2a2d35] border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer [&>option]:bg-white dark:[&>option]:bg-[#2a2d35] [&>option]:text-gray-900 dark:[&>option]:text-white"
                                >
                                    <option value="Travel">Travel</option>
                                    <option value="Roommates">Roommates</option>
                                    <option value="Office">Office</option>
                                    <option value="Friends">Friends</option>
                                    <option value="Family">Family</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsCustomizationOpen(false)}
                                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCustomization}
                                className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-colors"
                            >
                                Save Changes
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
