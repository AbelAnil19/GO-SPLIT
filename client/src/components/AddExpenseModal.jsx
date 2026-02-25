import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';
import { getUserGroups } from '../firebase/firestore';
import { createExpense } from '../firebase/firestore';
import { calculateSplit } from '../utils/expenseCalculator';
import MinimalToast from './ui/MinimalToast';
import { useCurrency } from '../context/CurrencyContext';
import ReceiptUpload from './ReceiptUpload';

const AddExpenseModal = ({ isOpen, onClose, onExpenseAdded }) => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const { currency, currencySymbol, formatAmount } = useCurrency(); //Get user's current currency
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);

    // Form states
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('food');
    const [paidBy, setPaidBy] = useState('');
    const [splitWith, setSplitWith] = useState([]);
    const [splitPreview, setSplitPreview] = useState([]);
    const [splitType, setSplitType] = useState('equal'); // 'equal' or 'custom'
    const [customAmounts, setCustomAmounts] = useState({}); // { userId: amount }
    const [receiptData, setReceiptData] = useState(null); // Receipt upload data

    // Live validation errors
    const [errors, setErrors] = useState({
        description: '',
        amount: ''
    });

    // MinimalToast state for validation
    const [validationToast, setValidationToast] = useState({
        open: false,
        message: '',
        type: 'error'
    });

    const showValidationError = (message) => {
        setValidationToast({
            open: true,
            message,
            type: 'error'
        });
        setTimeout(() => {
            setValidationToast(prev => ({ ...prev, open: false }));
        }, 3000);
    };

    const categories = [
        { value: 'food', label: '🍔 Food & Dining', icon: 'restaurant' },
        { value: 'travel', label: '✈️ Travel', icon: ' flight' },
        { value: 'shopping', label: '🛍️ Shopping', icon: 'shopping_bag' },
        { value: 'entertainment', label: '🎬 Entertainment', icon: 'movie' },
        { value: 'bills', label: '💡 Bills & Utilities', icon: 'receipt_long' },
        { value: 'other', label: '📦 Other', icon: 'category' }
    ];

    // Fetch user's groups
    useEffect(() => {
        if (isOpen && currentUser) {
            fetchGroups();
        }
    }, [isOpen, currentUser]);

    // Set default paid by to current user
    useEffect(() => {
        if (currentUser && !paidBy) {
            setPaidBy(currentUser.uid);
        }
    }, [currentUser]);

    // Calculate split preview when amount or splitWith changes
    useEffect(() => {
        if (splitType === 'equal' && amount && splitWith.length > 0) {
            const participants = splitWith.map(m => m.userId);
            const splits = calculateSplit(parseFloat(amount), participants);

            const preview = splits.map(split => {
                const member = splitWith.find(m => m.userId === split.userId);
                return {
                    ...split,
                    name: member?.name || 'Unknown'
                };
            });

            setSplitPreview(preview);
        } else {
            setSplitPreview([]);
        }
    }, [amount, splitWith, splitType]);

    // Auto-calculate amount from custom splits
    useEffect(() => {
        if (splitType === 'custom' && Object.keys(customAmounts).length > 0) {
            const total = Object.values(customAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
            if (total > 0) {
                setAmount(total.toString());
            }
        }
    }, [customAmounts, splitType]);

    const fetchGroups = async () => {
        try {
            const userGroups = await getUserGroups(currentUser.uid);
            setGroups(userGroups);
            if (userGroups.length > 0 && !selectedGroup) {
                setSelectedGroup(userGroups[0]);
                // Initialize split with all members
                setSplitWith(userGroups[0].members);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
            addToast('Failed to load groups', 'error');
        }
    };

    const handleGroupChange = (groupId) => {
        const group = groups.find(g => g.id === groupId);
        setSelectedGroup(group);
        // Reset split to all members of new group
        if (group) {
            setSplitWith(group.members);
        }
    };

    // Live validation handlers
    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        setDescription(value);

        if (value && value.trim().length < 3) {
            setErrors(prev => ({ ...prev, description: 'Description must be at least 3 characters' }));
        } else {
            setErrors(prev => ({ ...prev, description: '' }));
        }
    };

    const handleAmountChange = (e) => {
        const value = e.target.value;
        // Only allow numbers and one decimal point
        const cleanValue = value.replace(/[^0-9.]/g, '');

        // Prevent multiple decimal points
        const parts = cleanValue.split('.');
        const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleanValue;

        setAmount(finalValue);

        if (finalValue) {
            const numValue = parseFloat(finalValue);
            if (isNaN(numValue) || numValue <= 0) {
                setErrors(prev => ({ ...prev, amount: 'Amount must be greater than 0' }));
            } else if (finalValue.includes('.') && finalValue.split('.')[1]?.length > 2) {
                setErrors(prev => ({ ...prev, amount: 'Maximum 2 decimal places allowed' }));
            } else {
                setErrors(prev => ({ ...prev, amount: '' }));
            }
        } else {
            setErrors(prev => ({ ...prev, amount: '' }));
        }
    };

    const handleMemberToggle = (member) => {
        setSplitWith(prev => {
            const exists = prev.find(m => m.userId === member.userId);
            if (exists) {
                // Don't allow removing everyone
                if (prev.length === 1) {
                    addToast('At least one person must be in the split', 'error');
                    return prev;
                }
                return prev.filter(m => m.userId !== member.userId);
            }
            return [...prev, member];
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!description.trim()) {
            showValidationError('Please enter a description');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            showValidationError('Please enter a valid amount');
            return;
        }

        if (!selectedGroup) {
            showValidationError('Please select a group');
            return;
        }

        if (splitWith.length === 0) {
            showValidationError('Please select at least one person to split with');
            return;
        }

        // Validate custom splits if custom type is selected
        if (splitType === 'custom') {
            const totalCustom = Object.values(customAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
            const expenseAmount = parseFloat(amount);

            // More lenient tolerance since amount may be auto-calculated
            if (Math.abs(totalCustom - expenseAmount) > 0.1) {
                showValidationError(`Custom amounts (${formatAmount(totalCustom)}) must equal total expense (${formatAmount(expenseAmount)})`);
                return;
            }

            // Check all participants have amounts
            for (const member of splitWith) {
                if (!customAmounts[member.userId] || parseFloat(customAmounts[member.userId]) <= 0) {
                    showValidationError(`Please enter a valid amount for ${member.name}`);
                    return;
                }
            }
        }

        setLoading(true);

        try {
            const paidByMember = selectedGroup.members.find(m => m.userId === paidBy);
            const participants = splitWith.map(m => m.userId);

            // Use custom splits if custom type, otherwise equal split
            const customSplitData = splitType === 'custom'
                ? Object.fromEntries(
                    Object.entries(customAmounts).map(([userId, amt]) => [userId, parseFloat(amt)])
                )
                : null;

            const splits = calculateSplit(parseFloat(amount), participants, customSplitData);

            const expenseData = {
                groupId: selectedGroup.id,
                description: description.trim(),
                amount: parseFloat(amount),
                originalCurrency: currency, // Store user's current currency
                category,
                paidBy,
                paidByName: paidByMember?.name || currentUser.displayName,
                receipt: receiptData || null, // Add receipt data
                splitBetween: splits.map(split => {
                    const member = splitWith.find(m => m.userId === split.userId);
                    return {
                        userId: split.userId,
                        name: member?.name || 'Unknown',
                        amount: split.amount
                    };
                })
            };

            await createExpense(expenseData);

            addToast('Expense added successfully!', 'success');

            // Reset form
            setDescription('');
            setAmount('');
            setCategory('food');
            setSplitWith(selectedGroup.members);
            setReceiptData(null); // Reset receipt data

            if (onExpenseAdded) {
                onExpenseAdded();
            }

            onClose();
        } catch (error) {
            console.error('Error creating expense:', error);
            addToast('Failed to add expense', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-[#0d191b] dark:text-white">Add Expense</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Group Selection */}
                    <div>
                        <label className="block text-sm font-medium text-[#5c6f73] dark:text-gray-300 mb-2">
                            Group
                        </label>
                        <select
                            value={selectedGroup?.id || ''}
                            onChange={(e) => handleGroupChange(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                            required
                        >
                            {groups.map(group => (
                                <option key={group.id} value={group.id} className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">
                                    {group.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-[#5c6f73] dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={handleDescriptionChange}
                            placeholder="e.g., Dinner at restaurant"
                            className={`w-full px-4 py-3 rounded-xl border ${errors.description ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-white/10'} bg-white dark:bg-white/5 text-[#0d191b] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all`}
                            required
                        />
                        {errors.description && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                                {errors.description}
                            </p>
                        )}
                    </div>

                    {/* Amount and Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#5c6f73] dark:text-gray-300 mb-2">
                                Amount ({currencySymbol})
                            </label>
                            <input
                                type="text"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="0.00"
                                className={`w-full px-4 py-3 rounded-xl border ${errors.amount ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-white/10'} bg-white dark:bg-white/5 text-[#0d191b] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all`}
                                required
                                disabled={splitType === 'custom'}
                            />
                            {errors.amount && (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                                    {errors.amount}
                                </p>
                            )}
                            {!errors.amount && amount && parseFloat(amount) > 0 && (
                                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                                    Valid amount
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#5c6f73] dark:text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value} className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Paid By */}
                    <div>
                        <label className="block text-sm font-medium text-[#5c6f73] dark:text-gray-300 mb-2">
                            Paid by
                        </label>
                        <select
                            value={paidBy}
                            onChange={(e) => setPaidBy(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                            required
                        >
                            {selectedGroup?.members.map(member => (
                                <option key={member.userId} value={member.userId} className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">
                                    {member.name} {member.userId === currentUser.uid ? '(You)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Split Between */}
                    <div>
                        <label className="block text-sm font-medium text-[#5c6f73] dark:text-gray-300 mb-2">
                            Split between
                        </label>
                        <div className="space-y-2">
                            {selectedGroup?.members.map(member => (
                                <label
                                    key={member.userId}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={splitWith.some(m => m.userId === member.userId)}
                                        onChange={() => handleMemberToggle(member)}
                                        className="w-5 h-5 rounded border-gray-300 text-amber-400 focus:ring-amber-400"
                                    />
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                        {member.name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-[#0d191b] dark:text-white">
                                        {member.name} {member.userId === currentUser.uid ? '(You)' : ''}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Split Type Selector */}
                    <div>
                        <label className="block text-sm font-medium text-[#5c6f73] dark:text-gray-300 mb-3">
                            Split Method
                        </label>
                        <div className="flex gap-4">
                            <label className="flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-white/5"
                                style={{
                                    borderColor: splitType === 'equal' ? '#f59e0b' : 'rgba(156, 163, 175, 0.3)',
                                    backgroundColor: splitType === 'equal' ? 'rgba(245, 158, 11, 0.1)' : 'transparent'
                                }}>
                                <input
                                    type="radio"
                                    name="splitType"
                                    value="equal"
                                    checked={splitType === 'equal'}
                                    onChange={(e) => {
                                        setSplitType(e.target.value);
                                        setCustomAmounts({});
                                    }}
                                    className="w-5 h-5 text-amber-400 focus:ring-amber-400"
                                />
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">Equal Split</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Split amount equally</div>
                                </div>
                            </label>
                            <label className="flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-white/5"
                                style={{
                                    borderColor: splitType === 'custom' ? '#f59e0b' : 'rgba(156, 163, 175, 0.3)',
                                    backgroundColor: splitType === 'custom' ? 'rgba(245, 158, 11, 0.1)' : 'transparent'
                                }}>
                                <input
                                    type="radio"
                                    name="splitType"
                                    value="custom"
                                    checked={splitType === 'custom'}
                                    onChange={(e) => setSplitType(e.target.value)}
                                    className="w-5 h-5 text-amber-400 focus:ring-amber-400"
                                />
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">Custom Split</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Enter different amounts</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Custom Amount Inputs */}
                    {splitType === 'custom' && splitWith.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-[#5c6f73] dark:text-gray-300 mb-3">
                                Custom Amounts
                            </label>
                            <div className="space-y-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                {splitWith.map(member => (
                                    <div key={member.userId} className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">
                                            {member.name}
                                        </span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={customAmounts[member.userId] || ''}
                                            onChange={(e) => setCustomAmounts(prev => ({
                                                ...prev,
                                                [member.userId]: e.target.value
                                            }))}
                                            className="w-28 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                                        />
                                        <span className="text-gray-500 dark:text-gray-400">{currencySymbol}</span>
                                    </div>
                                ))}
                                <div className="pt-3 border-t border-gray-300 dark:border-white/10 flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">Total:</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-lg font-bold ${Math.abs((Object.values(customAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0)) - (parseFloat(amount) || 0)) < 0.01 && amount
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {formatAmount(Object.values(customAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0))}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">/ {formatAmount(parseFloat(amount || 0))}</span>
                                        {Math.abs((Object.values(customAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0)) - (parseFloat(amount) || 0)) < 0.01 && amount && (
                                            <span className="text-green-600 dark:text-green-400">✓</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Split Preview - Only for Equal Split */}
                    {splitType === 'equal' && splitPreview.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-3">Split Preview</h4>
                            <div className="space-y-2">
                                {splitPreview.map(split => (
                                    <div key={split.userId} className="flex items-center justify-between text-sm">
                                        <span className="text-amber-800 dark:text-amber-300">{split.name}</span>
                                        <span className="font-bold text-amber-900 dark:text-amber-400">
                                            {formatAmount(split.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Receipt Upload */}
                    <div>
                        <label className="block text-sm font-medium text-[#5c6f73] dark:text-gray-300 mb-2">
                            📎 Attach Receipt (Optional)
                        </label>
                        <ReceiptUpload
                            onUploadComplete={(data) => setReceiptData(data)}
                            existingReceipt={receiptData}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-xl font-bold text-[#5c6f73] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 rounded-xl bg-amber-400 text-black font-bold hover:bg-amber-300 shadow-lg shadow-amber-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Expense'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Validation Toast */}
            <MinimalToast
                open={validationToast.open}
                onClose={() => setValidationToast(prev => ({ ...prev, open: false }))}
                message={validationToast.message}
                type={validationToast.type}
            />
        </div>
    );
};

export default AddExpenseModal;

