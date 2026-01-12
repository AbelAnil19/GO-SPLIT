// Expense calculation utilities for GoSplit

/**
 * Calculate the split for an expense
 * @param {number} totalAmount - Total expense amount
 * @param {Array} participants - Array of participant user IDs
 * @param {Object} customSplits - Optional custom split amounts { userId: amount }
 * @returns {Array} - Array of { userId, amount }
 */
export const calculateSplit = (totalAmount, participants, customSplits = null) => {
    if (!participants || participants.length === 0) {
        return [];
    }

    if (customSplits) {
        // Custom split - validate that it adds up
        const total = Object.values(customSplits).reduce((sum, amt) => sum + amt, 0);
        if (Math.abs(total - totalAmount) > 0.01) {
            throw new Error('Custom splits must add up to total amount');
        }
        return participants.map(userId => ({
            userId,
            amount: customSplits[userId] || 0
        }));
    }

    // Equal split
    const splitAmount = totalAmount / participants.length;
    const roundedAmount = Math.floor(splitAmount * 100) / 100; // Round down to 2 decimals
    const remainder = totalAmount - (roundedAmount * participants.length);

    return participants.map((userId, index) => ({
        userId,
        // First participant gets the remainder to ensure total adds up
        amount: index === 0 ? roundedAmount + remainder : roundedAmount
    }));
};

/**
 * Calculate total balance for a user across all expenses
 * @param {Array} expenses - Array of expense objects
 * @param {string} userId - User ID to calculate balance for
 * @returns {number} - Positive if user is owed, negative if user owes
 */
export const calculateTotalBalance = (expenses, userId) => {
    if (!expenses || expenses.length === 0) return 0;

    let balance = 0;

    expenses.forEach(expense => {
        if (expense.paidBy === userId) {
            // User paid - they're owed the split amounts from others
            const userSplit = expense.splitBetween.find(s => s.userId === userId);
            const userOwes = userSplit ? userSplit.amount : 0;
            balance += (expense.amount - userOwes);
        } else {
            // Someone else paid - user owes their split
            const userSplit = expense.splitBetween.find(s => s.userId === userId);
            if (userSplit) {
                balance -= userSplit.amount;
            }
        }
    });

    return Math.round(balance * 100) / 100;
};

/**
 * Calculate total amount user owes (negative balances only)
 * @param {Array} expenses - Array of expense objects
 * @param {string} userId - User ID
 * @returns {number} - Total amount owed (positive number)
 */
export const getAmountOwed = (expenses, userId) => {
    if (!expenses || expenses.length === 0) return 0;

    let totalOwed = 0;

    expenses.forEach(expense => {
        if (expense.paidBy !== userId && !expense.isSettled) {
            const userSplit = expense.splitBetween.find(s => s.userId === userId);
            if (userSplit) {
                totalOwed += userSplit.amount;
            }
        }
    });

    return Math.round(totalOwed * 100) / 100;
};

/**
 * Calculate total amount user is owed (positive balances only)
 * @param {Array} expenses - Array of expense objects
 * @param {string} userId - User ID
 * @returns {number} - Total amount user is owed
 */
export const getAmountUserIsOwed = (expenses, userId) => {
    if (!expenses || expenses.length === 0) return 0;

    let totalOwed = 0;

    expenses.forEach(expense => {
        if (expense.paidBy === userId && !expense.isSettled) {
            const userSplit = expense.splitBetween.find(s => s.userId === userId);
            const userOwes = userSplit ? userSplit.amount : 0;
            const othersOwe = expense.amount - userOwes;
            totalOwed += othersOwe;
        }
    });

    return Math.round(totalOwed * 100) / 100;
};

/**
 * Filter expenses by group
 * @param {Array} expenses - Array of expense objects
 * @param {string} groupId - Group ID to filter by
 * @returns {Array} - Filtered expenses
 */
export const filterByGroup = (expenses, groupId) => {
    if (!groupId || groupId === 'all') return expenses;
    return expenses.filter(expense => expense.groupId === groupId);
};

/**
 * Filter expenses by date range
 * @param {Array} expenses - Array of expense objects
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} - Filtered expenses
 */
export const filterByDateRange = (expenses, startDate, endDate) => {
    return expenses.filter(expense => {
        const expenseDate = expense.date.toDate ? expense.date.toDate() : new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
    });
};

/**
 * Get expenses for current month
 * @param {Array} expenses - Array of expense objects
 * @returns {Array} - Expenses from current month
 */
export const getCurrentMonthExpenses = (expenses) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return filterByDateRange(expenses, startOfMonth, endOfMonth);
};

/**
 * Calculate monthly spending total
 * @param {Array} expenses - Array of expense objects
 * @param {string} userId - User ID
 * @returns {number} - Total amount spent this month
 */
export const getMonthlySpending = (expenses, userId) => {
    const monthExpenses = getCurrentMonthExpenses(expenses);
    return monthExpenses
        .filter(expense => expense.paidBy === userId)
        .reduce((sum, expense) => sum + expense.amount, 0);
};

/**
 * Get pending settlements for a user
 * @param {Array} expenses - Array of expense objects  
 * @param {string} userId - User ID
 * @returns {Array} - Array of { person, amount, type: 'owe'|'owed' }
 */
export const getPendingSettlements = (expenses, userId, userMap = {}) => {
    const settlements = new Map();
    const names = new Map();
    const photos = new Map();

    expenses.forEach(expense => {
        if (expense.isSettled || expense.approvalStatus === 'pending') return;

        if (expense.paidBy === userId) {
            // User paid - others owe them
            expense.splitBetween.forEach(split => {
                if (split.userId !== userId) {
                    const current = settlements.get(split.userId) || 0;
                    settlements.set(split.userId, current + split.amount);

                    // Try to get name/photo from map, fallback to expense data
                    if (!names.has(split.userId)) {
                        names.set(split.userId, userMap[split.userId]?.name || split.name);
                    }
                    if (!photos.has(split.userId) && userMap[split.userId]?.photoURL) {
                        photos.set(split.userId, userMap[split.userId].photoURL);
                    }
                }
            });
        } else {
            // Someone else paid - user owes them
            const userSplit = expense.splitBetween.find(s => s.userId === userId);
            if (userSplit) {
                const current = settlements.get(expense.paidBy) || 0;
                settlements.set(expense.paidBy, current - userSplit.amount);

                if (!names.has(expense.paidBy)) {
                    names.set(expense.paidBy, userMap[expense.paidBy]?.name || expense.paidByName);
                }
                if (!photos.has(expense.paidBy) && userMap[expense.paidBy]?.photoURL) {
                    photos.set(expense.paidBy, userMap[expense.paidBy].photoURL);
                }
            }
        }
    });

    return Array.from(settlements.entries())
        .map(([personId, amount]) => ({
            personId,
            name: names.get(personId) || 'Unknown',
            photoURL: photos.get(personId) || null,
            amount: Math.abs(amount),
            type: amount > 0 ? 'owed' : 'owe'
        }))
        .filter(s => s.amount > 0.01)
        .sort((a, b) => b.amount - a.amount);
};
