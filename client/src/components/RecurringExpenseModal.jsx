import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';
import { getUserGroups } from '../firebase/firestore';
import { POPULAR_CURRENCIES } from '../services/currencyService';

const RecurringExpenseModal = ({ isOpen, onClose, onSave }) => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);

    // Form states
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('INR');
    const [category, setCategory] = useState('bills');
    const [frequency, setFrequency] = useState('monthly');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paidBy, setPaidBy] = useState('');
    const [splitWith, setSplitWith] = useState([]);
    const [errors, setErrors] = useState({});

    const categories = [
        { value: 'food', label: '🍔 Food & Dining' },
        { value: 'travel', label: '✈️ Travel' },
        { value: 'shopping', label: '🛍️ Shopping' },
        { value: 'entertainment', label: '🎬 Entertainment' },
        { value: 'bills', label: '💡 Bills & Utilities' },
        { value: 'other', label: '📦 Other' }
    ];

    const frequencies = [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' }
    ];

    useEffect(() => {
        if (isOpen && currentUser) {
            fetchGroups();
        }
    }, [isOpen, currentUser]);

    useEffect(() => {
        if (currentUser && !paidBy) {
            setPaidBy(currentUser.uid);
        }
    }, [currentUser]);

    const fetchGroups = async () => {
        try {
            const userGroups = await getUserGroups(currentUser.uid);
            setGroups(userGroups);
            if (userGroups.length > 0 && !selectedGroup) {
                setSelectedGroup(userGroups[0]);
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
        if (group) {
            setSplitWith(group.members);
        }
    };

    const handleSave = () => {
        const newErrors = {};
        if (!selectedGroup) newErrors.group = 'Please select a group';
        if (!description.trim()) newErrors.description = 'Description is required';
        if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Must be greater than 0';
        if (!startDate) newErrors.startDate = 'Start date is required';
        if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
            newErrors.endDate = 'End date cannot be before start date';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        const recurringTemplate = {
            description,
            amount: parseFloat(amount),
            currency,
            category,
            frequency,
            startDate,
            endDate: endDate || null,
            groupId: selectedGroup.id,
            groupName: selectedGroup.name,
            paidBy,
            splitWith: splitWith.map(m => m.userId),
            createdBy: currentUser.uid,
            isActive: true,
            createdAt: new Date().toISOString()
        };

        onSave(recurringTemplate);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setCurrency('INR');
        setCategory('bills');
        setFrequency('monthly');
        setStartDate('');
        setEndDate('');
        setErrors({});
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a1c23] rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-[#1a1c23] border-b border-gray-200 dark:border-white/10 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-400">event_repeat</span>
                                Recurring Expense
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Create an expense that repeats automatically
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-6">
                    {/* Group Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Group *
                        </label>
                        <select
                            value={selectedGroup?.id || ''}
                            onChange={(e) => {
                                handleGroupChange(e.target.value);
                                if (errors.group) setErrors({ ...errors, group: null });
                            }}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.group ? 'border-red-500' : 'border-gray-300 dark:border-white/10'} bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all`}
                            required
                        >
                            {groups.map(group => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                        {errors.group && <p className="text-red-500 text-xs mt-1">{errors.group}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description *
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => {
                                const val = e.target.value;
                                setDescription(val);
                                if (!val.trim()) {
                                    setErrors({ ...errors, description: 'Description cannot be empty' });
                                } else {
                                    const newErrors = { ...errors };
                                    delete newErrors.description;
                                    setErrors(newErrors);
                                }
                            }}
                            placeholder="e.g., Netflix Subscription"
                            className={`w-full px-4 py-3 rounded-xl border ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-white/10'} bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all`}
                            required
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>

                    {/* Amount, Currency, Category Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Amount *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={amount}
                                onKeyDown={(e) => {
                                    if (['-', '+', 'e', 'E'].includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setAmount(val);
                                    if (!val || parseFloat(val) <= 0) {
                                        setErrors({ ...errors, amount: 'Amount must be greater than 0' });
                                    } else {
                                        const newErrors = { ...errors };
                                        delete newErrors.amount;
                                        setErrors(newErrors);
                                    }
                                }}
                                placeholder="0.00"
                                className={`w-full px-4 py-3 rounded-xl border ${errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-white/10'} bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all`}
                                required
                            />
                            {errors.amount && <p className="text-red-500 text-xs mt-1 leading-tight">{errors.amount}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Currency
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                            >
                                {POPULAR_CURRENCIES.map(curr => (
                                    <option key={curr.code} value={curr.code}>
                                        {curr.symbol} {curr.code}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Frequency *
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {frequencies.map(freq => (
                                <button
                                    key={freq.value}
                                    type="button"
                                    onClick={() => setFrequency(freq.value)}
                                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${frequency === freq.value
                                        ? 'bg-amber-400 text-black'
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                                        }`}
                                >
                                    {freq.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Start and End Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Date *
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setStartDate(val);

                                    const newErrors = { ...errors };
                                    if (!val) {
                                        newErrors.startDate = 'Start date is required';
                                    } else {
                                        delete newErrors.startDate;
                                    }

                                    // Also re-validate end date if it exists
                                    if (endDate && val && new Date(endDate) < new Date(val)) {
                                        newErrors.endDate = 'End date cannot be before start date';
                                    } else if (endDate) {
                                        delete newErrors.endDate;
                                    }

                                    setErrors(newErrors);
                                }}
                                min={new Date().toISOString().split('T')[0]}
                                className={`w-full px-4 py-3 rounded-xl border ${errors.startDate ? 'border-red-500' : 'border-gray-300 dark:border-white/10'} bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all`}
                                required
                            />
                            {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Date (Optional)
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setEndDate(val);
                                    if (val && startDate && new Date(val) < new Date(startDate)) {
                                        setErrors({ ...errors, endDate: 'End date cannot be before start date' });
                                    } else {
                                        const newErrors = { ...errors };
                                        delete newErrors.endDate;
                                        setErrors(newErrors);
                                    }
                                }}
                                min={startDate || new Date().toISOString().split('T')[0]}
                                className={`w-full px-4 py-3 rounded-xl border ${errors.endDate ? 'border-red-500' : 'border-gray-300 dark:border-white/10'} bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all`}
                            />
                            {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <div className="flex gap-3">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-sm">info</span>
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-semibold mb-1">Auto-Creation</p>
                                <p>This expense will be automatically created on the schedule you specified. The next expense will be created on {startDate || 'the start date'}.</p>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-xl font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-amber-400 hover:bg-amber-500 text-black rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg"
                        >
                            Create Recurring Expense
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecurringExpenseModal;
