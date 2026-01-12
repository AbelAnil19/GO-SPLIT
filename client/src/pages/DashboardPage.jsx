import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../firebase/authContext';
import { createGroup, getUserGroups, listenToUserGroups, getUserExpenses, createExpense, getUserDocument, updateExpense, deleteExpense } from '../firebase/firestore';
import { calculateTotalBalance, getAmountOwed, getAmountUserIsOwed, getMonthlySpending, getPendingSettlements } from '../utils/expenseCalculator';
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
            className={`p-6 rounded-3xl bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/10 backdrop-blur-md relative overflow-hidden group hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-soft cursor-pointer`}
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
                <div className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
                    <span className="material-symbols-outlined text-sm">{trendUp ? 'trending_up' : 'trending_down'}</span>
                    <span>{trend} {trendLabel}</span>
                </div>
            </div>
        </div>
    );
};

const GroupCard = ({ name, lastActive, settled, oweAmount, onOpen }) => (
    <div
        onClick={onOpen}
        className="p-5 rounded-2xl bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/10 hover:border-amber-400/30 transition-all cursor-pointer group shadow-soft"
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
            <div className="relative bg-[#1a1c23] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                <h2 className="text-xl font-bold text-white mb-4">Create New Group</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm font-bold mb-2">Group Name</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors"
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
                            className="px-4 py-2 text-gray-400 font-bold hover:text-white transition-colors"
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

        setStats({
            totalBalance,
            youOwe,
            youreOwed,
            monthlySpending,
            activeGroups
        });

        // Create userMap for photos
        const userMap = {};
        groups.forEach(group => {
            if (group.members) {
                group.members.forEach(m => userMap[m.userId] = m);
            }
        });

        // Calculate pending settlements
        const settlements = getPendingSettlements(expenses, currentUser.uid, userMap);
        setPendingSettlements(settlements);

        // Calculate pending approvals (Approvals Map: userId -> { type, amount, expenseId })
        const approvalsMap = {};
        expenses.forEach(expense => {
            if (expense.approvalStatus === 'pending') {
                const isPayer = expense.paidBy === currentUser.uid;
                const isReceiver = expense.splitBetween.some(s => s.userId === currentUser.uid);

                if (isPayer) {
                    // I paid, waiting for approval
                    const receiverId = expense.splitBetween[0].userId; // Assuming single receiver for settlement
                    approvalsMap[receiverId] = { type: 'outgoing', amount: expense.amount, expenseId: expense.id };
                } else if (isReceiver) {
                    // Someone paid me, waiting for my approval
                    approvalsMap[expense.paidBy] = { type: 'incoming', amount: expense.amount, expenseId: expense.id };
                }
            }
        });
        setPendingApprovals(approvalsMap);
    }, [expenses, groups, currentUser]);

    const handleSettleUp = async (settlement) => {
        if (!currentUser) return;

        const { personId, type } = settlement;
        if (type === 'owe') {
            try {
                const userData = await getUserDocument(personId);
                if (userData && userData.upiId) {
                    setPaymentModal({ isOpen: true, data: { ...settlement, upiId: userData.upiId } });
                    return;
                }
            } catch (error) { console.error(error); }
        }
        processSettlement(settlement);
    };

    const processSettlement = async (settlement) => {
        if (!currentUser) return;

        try {
            const { personId, name, amount, type } = settlement;
            const payerId = type === 'owe' ? currentUser.uid : personId;
            const receiverId = type === 'owe' ? personId : currentUser.uid;

            const expenseData = {
                groupId: 'settlement',
                description: 'Settlement',
                amount: parseFloat(amount),
                category: 'other',
                paidBy: payerId,
                paidByName: type === 'owe' ? currentUser.displayName : name,
                date: new Date(),
                splitBetween: [{
                    userId: receiverId,
                    name: type === 'owe' ? name : currentUser.displayName,
                    amount: parseFloat(amount)
                }],
                isSettled: false,
                approvalStatus: 'pending' // Mark as pending approval
            };

            await createExpense(expenseData);
            if (type === 'owe') {
                addToast(`Payment to ${name} recorded! Waiting for their approval.`, 'info');
            } else {
                addToast(`Settlement recorded.`, 'success');
            }
            setPaymentModal({ isOpen: false, data: null });
        } catch (error) {
            console.error("Error settling up:", error);
            addToast("Failed to record settlement", "error");
        }
    };

    const handleApprovePayment = async (expenseId, name) => {
        try {
            await updateExpense(expenseId, { approvalStatus: 'approved' });
            addToast(`Payment from ${name} verified!`, 'success');
        } catch (error) {
            console.error("Error verifying payment:", error);
            addToast("Failed to verify payment", "error");
        }
    };

    const handleRejectPayment = async (expenseId, name) => {
        if (!window.confirm(`Are you sure you want to reject the payment from ${name}?`)) return;
        try {
            await deleteExpense(expenseId, null, 0); // null groupId, 0 amount (settlements don't affect group totals usually or we don't care about groupId here)
            addToast(`Payment from ${name} rejected.`, 'info');
        } catch (error) {
            console.error("Error rejecting payment:", error);
            addToast("Failed to reject payment", "error");
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
                    trend={stats.totalBalance >= 0 ? '+15%' : '-8%'}
                    trendLabel="this month"
                    trendUp={stats.totalBalance >= 0}
                    color={stats.totalBalance >= 0 ? 'green' : 'red'}
                />
                <StatCard
                    IconComponent={PaymentsIcon}
                    label="Expenses (Month)"
                    value={`₹${stats.monthlySpending.toFixed(2)}`}
                    trend="12%"
                    trendLabel="less than last month"
                    trendUp={true}
                    color="amber"
                />
                <StatCard
                    IconComponent={TrendingDownIcon}
                    label="You Owe"
                    value={`₹${stats.youOwe.toFixed(2)}`}
                    trend="2"
                    trendLabel="friends pending"
                    trendUp={false}
                    color="red"
                />
                <StatCard
                    IconComponent={TrendingUpIcon}
                    label="You Are Owed"
                    value={`₹${stats.youreOwed.toFixed(2)}`}
                    trend="1"
                    trendLabel="group pending"
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
                                <div className="col-span-1 md:col-span-2 bg-white dark:bg-white/5 p-6 rounded-2xl border-2 border-gray-300 dark:border-white/10 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500 mb-2">
                                        <span className="material-symbols-outlined">check</span>
                                    </div>
                                    <p className="font-bold text-[#0d191b] dark:text-white">All settled up!</p>
                                    <p className="text-sm text-[#5c6f73] dark:text-gray-400">You don't owe anyone anything right now.</p>
                                </div>
                            ) : (
                                pendingSettlements.map((settlement) => (
                                    <div key={settlement.personId} className="bg-white dark:bg-white/5 p-5 rounded-2xl border-2 border-gray-300 dark:border-white/10 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
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
                                                                onClick={() => handleRejectPayment(pendingApprovals[settlement.personId].expenseId, settlement.name)}
                                                                className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                            <button
                                                                onClick={() => handleApprovePayment(pendingApprovals[settlement.personId].expenseId, settlement.name)}
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
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2 min-h-[140px] col-span-2">
                                    <span className="material-symbols-outlined text-4xl text-white/40">group_off</span>
                                    <p className="text-white/60">No groups yet. Create one to get started!</p>
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
                <aside className="bg-white dark:bg-white/5 p-6 rounded-3xl border-2 border-gray-300 dark:border-white/10 h-full backdrop-blur-sm">
                    <h2 className="text-lg font-bold text-[#0d191b] dark:text-white mb-6">Recent Activity</h2>
                    <div className="relative pl-4 border-l border-gray-200 dark:border-white/10 space-y-8">
                        {[
                            { user: 'Sarah', action: 'added "Utility Bill"', target: 'Apt 4B Roomies', time: '2 mins ago', color: 'blue' },
                            { user: userFirstName, action: 'settled $15.00 with', target: 'Mike', time: '1 hour ago', color: 'green' },
                            { user: 'John', action: 'commented on "Grocery Run"', time: '3 hours ago', color: 'gray' },
                        ].map((item, index) => (
                            <div key={index} className="relative">
                                <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-${item.color}-500 ring-4 ring-[#0f172a]`}></div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-[#5c6f73] dark:text-gray-300 leading-relaxed">
                                        <span className="font-bold text-[#0d191b] dark:text-white">{item.user}</span> {item.action} {item.target && <span className="font-semibold text-amber-500">{item.target}</span>}.
                                    </p>
                                    <span className="text-xs text-[#5c6f73] dark:text-gray-400">{item.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/dashboard/history" className="block w-full text-center mt-8 py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors border border-white/10 rounded-xl hover:bg-white/5 hover:border-white/20">
                        View Full History
                    </Link>

                    {/* Pro Upgrade Card */}
                    <div className="mt-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:opacity-20 transition-opacity"></div>
                        <h3 className="font-bold text-lg mb-2 relative z-10">Go Pro!</h3>
                        <p className="text-sm opacity-90 mb-4 relative z-10 text-indigo-100">Scan receipts automatically and export reports.</p>
                        <button
                            onClick={() => addToast('Premium features coming soon!', 'info')}
                            className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition relative z-10 shadow-lg"
                        >
                            Upgrade Now
                        </button>
                    </div>
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
