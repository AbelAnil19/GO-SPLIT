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

    // Equal split using integer math to avoid floating point errors
    const totalCents = Math.round(totalAmount * 100);
    const splitCents = Math.floor(totalCents / participants.length);
    const remainderCents = totalCents - (splitCents * participants.length);

    return participants.map((userId, index) => {
        let amountCents = splitCents;
        // Distribute remainder cents to first few participants
        if (index < remainderCents) {
            amountCents += 1;
        }
        return {
            userId,
            amount: amountCents / 100
        };
    });
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

    // Reuse the robust logic from getPendingSettlements
    const settlements = getPendingSettlements(expenses, userId);

    // Sum up only the 'owe' type
    const totalOwed = settlements
        .filter(s => s.type === 'owe')
        .reduce((sum, s) => sum + s.amount, 0);

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

    // Reuse the robust logic from getPendingSettlements
    const settlements = getPendingSettlements(expenses, userId);

    // Sum up only the 'owed' type
    const totalOwed = settlements
        .filter(s => s.type === 'owed')
        .reduce((sum, s) => sum + s.amount, 0);

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
        if (!expense.date) return false;
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
            expense.splitBetween?.forEach(split => {
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
            const userSplit = expense.splitBetween?.find(s => s.userId === userId);
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

/**
 * Compare current month's spending vs last month's
 * @param {Array} expenses 
 * @param {string} userId 
 * @returns {Object} { diffPercent, isHigher: boolean }
 */
export const getMonthlySpendingTrend = (expenses, userId) => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const thisMonthTotal = expenses
        .filter(e => {
            if (!e.date || e.paidBy !== userId) return false;
            const d = e.date.toDate ? e.date.toDate() : new Date(e.date);
            return d >= thisMonthStart;
        })
        .reduce((sum, e) => sum + e.amount, 0);

    const lastMonthTotal = expenses
        .filter(e => {
            if (!e.date || e.paidBy !== userId) return false;
            const d = e.date.toDate ? e.date.toDate() : new Date(e.date);
            return d >= lastMonthStart && d <= lastMonthEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);

    if (lastMonthTotal === 0) return { diffPercent: 100, isHigher: true };

    const diff = thisMonthTotal - lastMonthTotal;
    const diffPercent = Math.round(Math.abs(diff / lastMonthTotal) * 100);

    return {
        diffPercent,
        isHigher: diff > 0
    };
};

/**
 * Calculate trend for Net Balance (This month vs Last month)
 * @param {Array} expenses 
 * @param {string} userId 
 * @returns {Object} { diff, isPositive: boolean }
 */
export const getBalanceTrend = (expenses, userId) => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate Net Balance Change for THIS MONTH only
    let thisMonthChange = 0;

    expenses.forEach(expense => {
        if (!expense.date) return;
        const d = expense.date.toDate ? expense.date.toDate() : new Date(expense.date);

        if (d >= thisMonthStart) {
            if (expense.paidBy === userId) {
                // I paid -> Balance increases (I am owed)
                const userSplit = expense.splitBetween.find(s => s.userId === userId);
                const userOwes = userSplit ? userSplit.amount : 0;
                thisMonthChange += (expense.amount - userOwes);
            } else {
                // Someone else paid -> Balance decreases (I owe)
                const userSplit = expense.splitBetween.find(s => s.userId === userId);
                if (userSplit) {
                    thisMonthChange -= userSplit.amount;
                }
            }
        }
    });

    return {
        diff: Math.abs(thisMonthChange),
        isPositive: thisMonthChange >= 0
    };
};
