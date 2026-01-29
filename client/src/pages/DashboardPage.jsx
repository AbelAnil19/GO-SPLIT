import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../firebase/authContext';
import { createGroup, getUserGroups, listenToUserGroups, getUserExpenses, createExpense, getUserDocument, updateExpense, deleteExpense, createActivity, listenToUserActivity, createSettlement, approveSettlement, rejectSettlement, listenToUserSettlements, createNotification } from '../firebase/firestore';
import { calculateTotalBalance, getAmountOwed, getAmountUserIsOwed, getMonthlySpending, getPendingSettlements, getMonthlySpendingTrend, getBalanceTrend } from '../utils/expenseCalculator';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { WalletIcon } from '../components/icons/WalletIcon';
import { PaymentsIcon } from '../components/icons/PaymentsIcon';
import { TrendingDownIcon } from '../components/icons/TrendingDownIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';

const StatCard = ({ IconComponent, label, value, trend, trendLabel, trendUp, color }) => {
    const iconRef = React.useRef(null);

    return (
        <div
            className={`p-6 rounded-3xl bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] border-2 border-gray-200 dark:border-white/10 backdrop-blur-[2px] relative overflow-hidden group hover:shadow-lg transition-all shadow-md dark:shadow-none cursor-pointer`}
            onMouseEnter={() => iconRef.current?.startAnimation()}
            onMouseLeave={() => iconRef.current?.stopAnimation()}
        >
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity bg-${color}-500`}></div>
            <div className="flex items-center gap-3 relative z-10 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-500/10 text-${color}-400`}>
                    <IconComponent ref={iconRef} size={20} duration={0.8} isAnimated={true} />
                </div>
                <span className="text-[#5c6f73] dark:text-gray-400 text-sm font-medium">{label}</span>
            </div>
            <div className="relative z-10">
                <h3 className="text-3xl font-bold text-[#0d191b] dark:text-white mb-2">{value}</h3>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="material-symbols-outlined text-sm">{trendUp ? 'trending_up' : 'trending_down'}</span>
                        <span>{trend} {trendLabel}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const GroupCard = ({ name, lastActive, settled, oweAmount, onOpen }) => (
    <div
        onClick={onOpen}
        className="p-5 rounded-2xl bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] border-2 border-gray-200 dark:border-white/10 hover:border-amber-400/30 transition-all cursor-pointer group shadow-md dark:shadow-none backdrop-blur-[2px] hover:shadow-xl"
    >
        <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/10 to-orange-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">flight</span>
            </div>
            {settled ? (
                <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-lg text-xs font-bold border border-green-500/20">Settled</span>
            ) : (
                <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold border border-red-500/20">You owe ${oweAmount}</span>
            )}
        </div>
        <h3 className="font-bold text-lg text-[#0d191b] dark:text-white mb-1 group-hover:text-amber-500 transition-colors">{name}</h3>
        <p className="text-xs text-[#5c6f73] dark:text-gray-500 mb-4">Last activity: {lastActive}</p>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200 dark:border-white/5">
            <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-[#1a1a1a] flex items-center justify-center text-xs text-[#5c6f73] dark:text-gray-400">
                        {i}
                    </div>
                ))}
            </div>
            <button className="text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors">View Ledger</button>
        </div>
    </div>
);

const CreateGroupModal = ({ isOpen, onClose, onCreate }) => {
    const [groupName, setGroupName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate(groupName);
        setGroupName('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-[#1a1c23] border-2 border-gray-300 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Group</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-400 text-sm font-bold mb-2">Group Name</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-colors"
                            placeholder="e.g. Summer Trip"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-400 font-bold hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-amber-400 text-black font-bold rounded-xl hover:bg-amber-300 transition-colors"
                        >
                            Create Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
};

const getActivityColor = (type) => {
    switch (type) {
        case 'group_created': return 'blue';
        case 'expense_added': return 'amber';
        case 'payment_verified': return 'green';
        default: return 'gray';
    }
};

const DashboardPage = () => {
    const { addToast } = useToast();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState([]);
    const [stats, setStats] = useState({
        totalBalance: 0,
        youOwe: 0,
        youreOwed: 0,
        monthlySpending: 0,
        activeGroups: 0
    });
    const [pendingSettlements, setPendingSettlements] = useState([]);
    const [pendingApprovals, setPendingApprovals] = useState({});
    const [settlements, setSettlements] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [paymentModal, setPaymentModal] = useState({ isOpen: false, data: null });

    // Get user's first name
    const userFirstName = currentUser?.displayName?.split(' ')[0] || 'You';

    // Fetch groups with real-time listener
    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = listenToUserGroups(currentUser.uid, (groupsData) => {
            setGroups(groupsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Fetch expenses with real-time listener
    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'expenses'),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const expensesData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(expense =>
                    expense.paidBy === currentUser.uid ||
                    expense.splitBetween.some(split => split.userId === currentUser.uid)
                );

            setExpenses(expensesData);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Calculate stats whenever expenses or groups change
    useEffect(() => {
        if (!currentUser || !expenses) return;

        const totalBalance = calculateTotalBalance(expenses, currentUser.uid);
        const youOwe = getAmountOwed(expenses, currentUser.uid);
        const youreOwed = getAmountUserIsOwed(expenses, currentUser.uid);
        const monthlySpending = getMonthlySpending(expenses, currentUser.uid);

        const activeGroups = groups.filter(g => !g.isSettled).length;
        const spendingTrend = getMonthlySpendingTrend(expenses, currentUser.uid);
        const balanceTrend = getBalanceTrend(expenses, currentUser.uid);

        setStats({
            totalBalance,
            youOwe,
            youreOwed,
            monthlySpending,
            activeGroups,
            spendingTrend,
            balanceTrend: balanceTrend.isPositive ? balanceTrend.diff : -balanceTrend.diff
        });

        // Create userMap for photos
        const userMap = {};
        groups.forEach(group => {
            if (group.members) {
                group.members.forEach(m => userMap[m.userId] = m);
            }
        });

        // Calculate pending settlements (from expenses only, not settlement collection)
        const settlementSuggestions = getPendingSettlements(expenses, currentUser.uid, userMap);
        setPendingSettlements(settlementSuggestions);

        // Calculate pending approvals from settlements collection (handled by separate effect)
    }, [expenses, groups, currentUser, settlements]);

    // Listen to settlements collection
    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = listenToUserSettlements(currentUser.uid, (settlementsData) => {
            setSettlements(settlementsData);

            // Map pending settlements to approvals format
            const approvalsMap = {};
            settlementsData
                .filter(s => s.status === 'pending')
                .forEach(settlement => {
                    if (settlement.fromUserId === currentUser.uid) {
                        // I sent payment, waiting for approval
                        approvalsMap[settlement.toUserId] = {
                            type: 'outgoing',
                            amount: settlement.amount,
                            settlementId: settlement.id,
                            name: settlement.toUserName
                        };
                    } else if (settlement.toUserId === currentUser.uid) {
                        // I received payment request, needs my approval
                        approvalsMap[settlement.fromUserId] = {
                            type: 'incoming',
                            amount: settlement.amount,
                            settlementId: settlement.id,
                            name: settlement.fromUserName
                        };
                    }
                });
            setPendingApprovals(approvalsMap);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Listen to recent activity
    useEffect(() => {
        if (!currentUser) return;
        const unsubscribe = listenToUserActivity(currentUser.uid, (activities) => {
            setRecentActivity(activities);
        });
        return () => unsubscribe();
    }, [currentUser]);

    const handleSettleUp = async (settlement) => {
        if (!currentUser) return;

        const { personId, type, name } = settlement;

        // If someone owes YOU money, show reminder toast (can't force them to pay)
        if (type === 'owed') {
            addToast(`Reminder: ${name} owes you ₹${settlement.amount.toFixed(2)}`, 'info');
            return;
        }

        // If YOU owe someone, proceed with payment
        if (type === 'owe') {
            try {
                const userData = await getUserDocument(personId);
                if (userData && userData.upiId) {
                    setPaymentModal({ isOpen: true, data: { ...settlement, upiId: userData.upiId } });
                } else {
                    // UPI ID not found - show error and STOP
                    addToast(`Payment failed: ${name} must upload their UPI ID to receive payments.`, 'error');

                    // Allow firing this notification even if we stop the payment flow
                    createNotification(
                        personId,
                        'system',
                        'Action Required: Add UPI ID',
                        `${userFirstName} tried to pay you but couldn't because your UPI ID is missing. Please add it in Settings.`,
                        {
                            type: 'missing_upi',
                            fromUserId: currentUser.uid
                        }
                    );
                }
            } catch (error) {
                console.error(error);
                addToast('Failed to fetch payment details', 'error');
            }
        }
    };

    const processSettlement = async (settlement) => {
        if (!currentUser) return;

        try {
            const { personId, name, amount, photoURL } = settlement;

            // Get receiver data
            const receiverData = await getUserDocument(personId);

            // Create settlement record
            await createSettlement(
                currentUser.uid,  // fromUserId (payer)
                personId,         // toUserId (receiver)
                parseFloat(amount),
                currentUser,      // fromUserData
                receiverData      // toUserData
            );

            addToast(`Settlement request sent to ${name}`, 'success');
            setPaymentModal({ isOpen: false, data: null });
        } catch (error) {
            console.error('Error processing settlement:', error);
            addToast('Failed to record settlement', 'error');
        }
    };

    const handleApprovePayment = async (settlementId, name) => {
        try {
            await approveSettlement(settlementId);
            addToast(`${name}'s payment approved!`, 'success');
        } catch (error) {
            console.error('Error approving settlement:', error);
            addToast('Failed to approve payment', 'error');
        }
    };

    const handleRejectPayment = async (settlementId, name) => {
        try {
            await rejectSettlement(settlementId);
            addToast(`${name}'s payment rejected`, 'info');
        } catch (error) {
            console.error('Error rejecting settlement:', error);
            addToast('Failed to reject payment', 'error');
        }
    };

    const handleRemind = (name) => {
        addToast(`Reminder sent to ${name}!`, 'info');
    };

    const handleCreateGroup = async (name) => {
        try {
            await createGroup(name, currentUser.uid, {
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL
            });
            addToast(`Group "${name}" created successfully!`, 'success');
            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Error creating group:', error);
            addToast('Failed to create group. Please try again.', 'error');
        }
    };

    const handleViewLedger = (groupName) => {
        navigate('/dashboard/groups');
        addToast(`Navigating to ${groupName} ledger...`, 'info');
    };

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Quick Stats Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    IconComponent={WalletIcon}
                    label="Total Balance"
                    value={`₹${Math.abs(stats.totalBalance).toFixed(2)}`}
                    trend={`₹${Math.abs(stats.balanceTrend || 0)}`}
                    trendLabel="change this month"
                    trendUp={(stats.balanceTrend || 0) >= 0}
                    color={(stats.totalBalance || 0) >= 0 ? 'green' : 'red'}
                />
                <StatCard
                    IconComponent={PaymentsIcon}
                    label="Expenses (Month)"
                    value={`₹${stats.monthlySpending.toFixed(2)}`}
                    trend={`${stats.spendingTrend?.diffPercent || 0}%`}
                    trendLabel={`${stats.spendingTrend?.isHigher ? 'more' : 'less'} than last month`}
                    trendUp={!stats.spendingTrend?.isHigher}
                    color="amber"
                />
                <StatCard
                    IconComponent={TrendingDownIcon}
                    label="You Owe"
                    value={`₹${stats.youOwe.toFixed(2)}`}
                    trend={pendingSettlements.filter(s => s.type === 'owe').length > 0
                        ? pendingSettlements.filter(s => s.type === 'owe').length
                        : "All settled up"}
                    trendLabel={pendingSettlements.filter(s => s.type === 'owe').length > 0 ? "people pending" : ""}
                    trendUp={false}
                    color="red"
                />
                <StatCard
                    IconComponent={TrendingUpIcon}
                    label="You Are Owed"
                    value={`₹${stats.youreOwed.toFixed(2)}`}
                    trend={pendingSettlements.filter(s => s.type === 'owed').length > 0
                        ? pendingSettlements.filter(s => s.type === 'owed').length
                        : "No pending payments"}
                    trendLabel={pendingSettlements.filter(s => s.type === 'owed').length > 0 ? "people pending" : ""}
                    trendUp={true}
                    color="green"
                />
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column (Groups & Settlements) */}
                <div className="xl:col-span-2 flex flex-col gap-8">
                    {/* Settlements Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[#0d191b] dark:text-white">Pending Settlements</h2>
                            {pendingSettlements.length > 0 && (
                                <Link to="/dashboard/expenses" className="text-amber-400 text-sm font-semibold hover:text-amber-300">View all</Link>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingSettlements.length === 0 ? (
                                <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] p-8 rounded-2xl border-2 border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center shadow-md dark:shadow-none backdrop-blur-[2px]">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-green-500/20">
                                        <span className="material-symbols-outlined text-2xl">check</span>
                                    </div>
                                    <p className="font-bold text-lg text-[#0d191b] dark:text-white mb-1">All settled up!</p>
                                    <p className="text-sm text-[#5c6f73] dark:text-gray-400">You don't owe anyone anything right now.</p>
                                </div>
                            ) : (
                                pendingSettlements.map((settlement) => (
                                    <div key={settlement.personId} className="bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] p-5 rounded-2xl border-2 border-gray-200 dark:border-white/10 flex items-center justify-between hover:border-amber-400/30 dark:hover:border-white/20 transition-all backdrop-blur-[2px] shadow-md dark:shadow-none hover:shadow-xl">
                                        <div className="flex items-center gap-4">
                                            {settlement.photoURL ? (
                                                <img src={settlement.photoURL} alt={settlement.name} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-white/10" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-black font-bold text-lg">
                                                    {settlement.name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-[#0d191b] dark:text-white text-sm">{settlement.name}</p>
                                                <p className="text-xs text-[#5c6f73] dark:text-gray-400">
                                                    {settlement.type === 'owe' ? 'you owe' : 'owes you'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold mb-1 ${settlement.type === 'owed' ? 'text-green-500' : 'text-red-500'}`}>
                                                {settlement.type === 'owed' ? '+' : '-'}₹{settlement.amount.toFixed(2)}
                                            </p>
                                            <div className="flex gap-2 justify-end">
                                                {pendingApprovals[settlement.personId] ? (
                                                    pendingApprovals[settlement.personId].type === 'outgoing' ? (
                                                        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                                                            Pending Approval
                                                        </span>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleRejectPayment(pendingApprovals[settlement.personId].settlementId, settlement.name)}
                                                                className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                            <button
                                                                onClick={() => handleApprovePayment(pendingApprovals[settlement.personId].settlementId, settlement.name)}
                                                                className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors flex items-center gap-1"
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                                                Verify
                                                            </button>
                                                        </div>
                                                    )
                                                ) : (
                                                    <button
                                                        onClick={() => handleSettleUp(settlement)}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${settlement.type === 'owed'
                                                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 cursor-pointer'
                                                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                            }`}
                                                    >
                                                        {settlement.type === 'owed' ? 'Remind' : 'Settle Up'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Your Groups Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[#0d191b] dark:text-white">Your Groups</h2>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 bg-amber-400 text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-300 transition-colors shadow-lg shadow-amber-900/20"
                            >
                                <span className="material-symbols-outlined text-xl">add</span>
                                Create Group
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Loading State */}
                            {loading && (
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2 min-h-[140px] col-span-2">
                                    <span className="material-symbols-outlined text-4xl text-amber-400 animate-spin">refresh</span>
                                    <p className="text-white/60">Loading groups...</p>
                                </div>
                            )}

                            {/* No Groups State */}
                            {!loading && groups.length === 0 && (
                                <div className="bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] p-6 rounded-2xl border-2 border-gray-200 dark:border-white/10 flex flex-col items-center justify-center gap-2 min-h-[140px] col-span-2 shadow-md dark:shadow-none backdrop-blur-[2px]">
                                    <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-white/40">group_off</span>
                                    <p className="text-gray-600 dark:text-white/60">No groups yet. Create one to get started!</p>
                                </div>
                            )}

                            {/* Real Groups from Firestore */}
                            {!loading && groups.slice(0, 4).map((group) => (
                                <GroupCard
                                    key={group.id}
                                    name={group.name}
                                    lastActive="Active"
                                    settled={group.isSettled || false}
                                    onOpen={() => navigate('/dashboard/groups')}
                                />
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column (Activity Feed) */}
                <aside className="bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] p-6 rounded-3xl border-2 border-gray-200 dark:border-white/10 h-full backdrop-blur-[2px] shadow-md dark:shadow-none">
                    <h2 className="text-lg font-bold text-[#0d191b] dark:text-white mb-6">Recent Activity</h2>
                    <div className="relative pl-4 border-l border-gray-200 dark:border-white/10 space-y-6">
                        {recentActivity.length === 0 ? (
                            <p className="text-gray-400 text-sm italic">No recent activity</p>
                        ) : (
                            recentActivity.map((item) => (
                                <div key={item.id} className="relative group">
                                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-${getActivityColor(item.type)}-500 ring-4 ring-[#0f172a] group-hover:scale-125 transition-transform`}></div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm text-[#5c6f73] dark:text-gray-300 leading-relaxed">
                                            {item.description}
                                        </p>
                                        <span className="text-xs text-[#5c6f73] dark:text-gray-500 font-medium">{timeAgo(item.timestamp)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <Link to="/dashboard/history" className="block w-full text-center mt-8 py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors border border-white/10 rounded-xl hover:bg-white/5 hover:border-white/20">
                        View Full History
                    </Link>

                    {/* Pro Upgrade Card */}

                </aside>
            </div>

            {/* Floating Action Button (Mobile) */}
            <div className="fixed bottom-6 right-6 lg:hidden z-50">
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center w-14 h-14 bg-amber-400 text-black rounded-full shadow-lg shadow-amber-500/30 hover:bg-amber-300 hover:scale-110 transition-all"
                >
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            </div>

            {/* Payment Modal */}
            {paymentModal.isOpen && paymentModal.data && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPaymentModal({ isOpen: false, data: null })}></div>
                    <div className="relative bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in-up text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-400 mx-auto flex items-center justify-center text-black font-bold text-2xl mb-4">
                            {paymentModal.data.name.charAt(0)}
                        </div>
                        <h2 className="text-xl font-bold text-[#0d191b] dark:text-white mb-1">Pay {paymentModal.data.name}</h2>
                        <p className="text-[#5c6f73] dark:text-gray-400 mb-6 font-mono text-sm">{paymentModal.data.upiId}</p>

                        <div className="bg-white p-4 rounded-xl mx-auto w-fit mb-6 border border-gray-200 shadow-inner">
                            <QRCodeSVG
                                value={`upi://pay?pa=${paymentModal.data.upiId}&pn=${encodeURIComponent(paymentModal.data.name)}&am=${paymentModal.data.amount}&cu=INR`}
                                size={200}
                                level={"H"}
                            />
                        </div>

                        <h3 className="text-3xl font-bold text-[#0d191b] dark:text-white mb-6">₹{paymentModal.data.amount.toFixed(2)}</h3>

                        <div className="flex flex-col gap-3">
                            <a
                                href={`upi://pay?pa=${paymentModal.data.upiId}&pn=${encodeURIComponent(paymentModal.data.name)}&am=${paymentModal.data.amount}&cu=INR`}
                                className="w-full py-3 bg-amber-400 text-black font-bold rounded-xl hover:bg-amber-300 transition-colors shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">payments</span>
                                Pay via UPI App
                            </a>
                            <button
                                onClick={() => processSettlement(paymentModal.data)}
                                className="w-full py-3 bg-gray-100 dark:bg-white/5 text-[#0d191b] dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                            >
                                Record as Paid manually
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CreateGroupModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateGroup}
            />
        </div>
    );
};

export default DashboardPage;
