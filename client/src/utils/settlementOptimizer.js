// Smart Settlement Calculator
// Optimizes debt settlement to minimize number of transactions

/**
 * Calculates net balance for each person
 * @param {Array} expenses - Array of expense objects
 * @param {Array} members - Array of group members
 * @returns {Object} - Net balance for each person {userId: amount}
 */
export const calculateNetBalances = (expenses, members) => {
    const balances = {};

    // Initialize all members with 0 balance
    members.forEach(member => {
        balances[member.userId] = 0;
    });

    // Calculate net balances from expenses
    expenses.forEach(expense => {
        const { paidBy, splitBetween } = expense;

        // Person who paid gets credited
        balances[paidBy] = (balances[paidBy] || 0) + expense.amount;

        // People who owe get debited (only if splitBetween exists)
        if (splitBetween && Array.isArray(splitBetween)) {
            splitBetween.forEach(split => {
                balances[split.userId] = (balances[split.userId] || 0) - split.amount;
            });
        }
    });

    return balances;
};

/**
 * Optimizes settlements using greedy algorithm
 * @param {Object} balances - Net balances {userId: amount}
 * @param {Array} members - Array of group members for name lookup
 * @returns {Array} - Optimized transactions [{from, to, amount, fromName, toName}]
 */
export const optimizeSettlements = (balances, members) => {
    const transactions = [];

    // Create arrays of creditors (positive balance) and debtors (negative balance)
    const creditors = [];
    const debtors = [];

    Object.entries(balances).forEach(([userId, balance]) => {
        const member = members.find(m => m.userId === userId);
        const name = member?.name || 'Unknown';

        if (balance > 0.01) { // Creditor (is owed money)
            creditors.push({ userId, amount: balance, name });
        } else if (balance < -0.01) { // Debtor (owes money)
            debtors.push({ userId, amount: Math.abs(balance), name });
        }
    });

    // Greedy algorithm: match largest creditor with largest debtor
    while (creditors.length > 0 && debtors.length > 0) {
        // Sort by amount (descending)
        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);

        const creditor = creditors[0];
        const debtor = debtors[0];

        // Settle the minimum of the two amounts
        const settlementAmount = Math.min(creditor.amount, debtor.amount);

        transactions.push({
            from: debtor.userId,
            to: creditor.userId,
            amount: parseFloat(settlementAmount.toFixed(2)),
            fromName: debtor.name,
            toName: creditor.name
        });

        // Update balances
        creditor.amount -= settlementAmount;
        debtor.amount -= settlementAmount;

        // Remove if settled
        if (creditor.amount < 0.01) {
            creditors.shift();
        }
        if (debtor.amount < 0.01) {
            debtors.shift();
        }
    }

    return transactions;
};

/**
 * Get unoptimized transactions (everyone pays everyone directly)
 * @param {Array} expenses - Array of expense objects
 * @param {Array} members - Array of group members
 * @returns {Array} - All direct transactions
 */
export const getUnoptimizedTransactions = (expenses, members) => {
    const transactions = [];
    const directDebts = {}; // {fromUserId: {toUserId: amount}}

    expenses.forEach(expense => {
        const { paidBy, splitBetween } = expense;
        const payer = members.find(m => m.userId === paidBy);

        if (splitBetween && Array.isArray(splitBetween)) {
            splitBetween.forEach(split => {
                if (split.userId !== paidBy && split.amount > 0) {
                    const debtor = members.find(m => m.userId === split.userId);

                    // Track all individual debts
                    if (!directDebts[split.userId]) {
                        directDebts[split.userId] = {};
                    }

                    directDebts[split.userId][paidBy] =
                        (directDebts[split.userId][paidBy] || 0) + split.amount;
                }
            });
        }
    });

    // Convert to transaction list
    Object.entries(directDebts).forEach(([fromUserId, debts]) => {
        const fromMember = members.find(m => m.userId === fromUserId);

        Object.entries(debts).forEach(([toUserId, amount]) => {
            const toMember = members.find(m => m.userId === toUserId);

            if (amount > 0.01) {
                transactions.push({
                    from: fromUserId,
                    to: toUserId,
                    amount: parseFloat(amount.toFixed(2)),
                    fromName: fromMember?.name || 'Unknown',
                    toName: toMember?.name || 'Unknown'
                });
            }
        });
    });

    return transactions;
};

/**
 * Calculate savings from optimization
 * @param {Array} originalTransactions - Unoptimized transactions
 * @param {Array} optimizedTransactions - Optimized transactions
 * @returns {Object} - Statistics about the optimization
 */
export const calculateOptimizationStats = (originalTransactions, optimizedTransactions) => {
    return {
        originalCount: originalTransactions.length,
        optimizedCount: optimizedTransactions.length,
        transactionsSaved: originalTransactions.length - optimizedTransactions.length,
        percentageSaved: originalTransactions.length > 0
            ? Math.round(((originalTransactions.length - optimizedTransactions.length) / originalTransactions.length) * 100)
            : 0
    };
};
