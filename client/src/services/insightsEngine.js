/**
 * Smart Navigator Engine — Data-Driven Analytics
 * Analyzes user data and generates smart, context-aware group insights.
 */

// ==================== BUDGET HEALTH ====================
const defaultFormat = (val) => `₹${Number(val).toLocaleString()}`;

const analyzeBudgetHealth = (budgetData, expenses, formatAmount = defaultFormat) => {
    if (!budgetData || !budgetData.totalBudget) {
        return {
            type: 'budget',
            icon: '💰',
            title: 'No Budget Set',
            message: 'You haven\'t set a budget yet. Head to the Trip Planner to set one and I\'ll help you track it!',
            severity: 'info'
        };
    }

    const totalBudget = budgetData.totalBudget || 0;
    // Use pre-computed values from getBudgetAnalytics for accuracy
    // Fall back to re-computing only if pre-computed values aren't available
    const totalSpent = budgetData.utilized != null ? budgetData.utilized
        : (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const remaining = budgetData.remaining != null ? budgetData.remaining
        : (totalBudget - totalSpent);
    const percentUsed = budgetData.utilizationPercent != null ? Math.round(budgetData.utilizationPercent)
        : (totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0);

    const insights = [];

    // Overall health
    if (percentUsed >= 100) {
        insights.push({
            type: 'budget',
            icon: '🚨',
            title: 'Over Budget!',
            message: `You've spent ${formatAmount(totalSpent)} out of ${formatAmount(totalBudget)} — that's ${percentUsed}% of your budget. You're ${formatAmount(Math.abs(remaining))} over budget.`,
            severity: 'danger',
            priority: 10
        });
    } else if (percentUsed >= 80) {
        insights.push({
            type: 'budget',
            icon: '⚠️',
            title: 'Budget Running Low',
            message: `You've used ${percentUsed}% of your budget (${formatAmount(totalSpent)} spent / ${formatAmount(totalBudget)} total). Only ${formatAmount(remaining)} left.`,
            severity: 'warning',
            priority: 8
        });
    } else if (percentUsed >= 50) {
        insights.push({
            type: 'budget',
            icon: '📊',
            title: 'Budget Halfway There',
            message: `You've used ${percentUsed}% of your budget. ${formatAmount(remaining)} remaining out of ${formatAmount(totalBudget)}. You're on track!`,
            severity: 'info',
            priority: 4
        });
    } else if (percentUsed > 0) {
        insights.push({
            type: 'budget',
            icon: '✅',
            title: 'Budget Looking Great',
            message: `Only ${percentUsed}% used so far (${formatAmount(totalSpent)} spent). You have ${formatAmount(remaining)} remaining out of ${formatAmount(totalBudget)}. Plenty of room!`,
            severity: 'success',
            priority: 2
        });
    } else {
        insights.push({
            type: 'budget',
            icon: '✅',
            title: 'Budget Set — No Spending Yet',
            message: `Budget of ${formatAmount(totalBudget)} is set. No expenses logged yet — you have the full amount available!`,
            severity: 'success',
            priority: 2
        });
    }

    // Daily spending average (use pre-computed avgDaily if available)
    const avgDaily = budgetData.avgDaily || 0;
    if (avgDaily > 0 && remaining > 0) {
        const daysLeft = Math.floor(remaining / avgDaily);
        insights.push({
            type: 'budget',
            icon: '📈',
            title: 'Spending Pace',
            message: `Your daily average is ${formatAmount(Math.round(avgDaily))}/day. At this rate, your remaining budget will last about ${daysLeft} more day${daysLeft !== 1 ? 's' : ''}.`,
            severity: daysLeft < 3 ? 'warning' : 'info',
            priority: 5
        });
    } else if (avgDaily === 0 && expenses && expenses.length > 0) {
        // Fallback: compute from raw expenses if pre-computed not available
        const dates = expenses.map(e => new Date(e.createdAt?.seconds ? e.createdAt.seconds * 1000 : e.createdAt)).filter(d => !isNaN(d));
        if (dates.length >= 2) {
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            const daysDiff = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
            const calcDailyAvg = totalSpent / daysDiff;
            const daysLeft = remaining > 0 ? Math.floor(remaining / calcDailyAvg) : 0;
            insights.push({
                type: 'budget',
                icon: '📈',
                title: 'Spending Pace',
                message: `Your daily average is ${formatAmount(Math.round(calcDailyAvg))}/day. At this rate, remaining budget lasts about ${daysLeft} more days.`,
                severity: daysLeft < 3 ? 'warning' : 'info',
                priority: 5
            });
        }
    }

    return insights;
};

// ==================== EXPENSE BREAKDOWN ====================

const analyzeExpenses = (expenses, members, formatAmount = defaultFormat) => {
    if (!expenses || expenses.length === 0) {
        return {
            type: 'expenses',
            icon: '📝',
            title: 'No Expenses Yet',
            message: 'No expenses recorded yet. Start adding expenses and I\'ll give you spending insights!',
            severity: 'info'
        };
    }

    const insights = [];

    // Category breakdown
    const categoryTotals = {};
    expenses.forEach(e => {
        const cat = e.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0);
    });

    const sortedCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a);

    const topCategory = sortedCategories[0];
    const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    if (topCategory) {
        const topPercent = Math.round((topCategory[1] / totalSpent) * 100);
        insights.push({
            type: 'expenses',
            icon: '🏆',
            title: 'Top Spending Category',
            message: `**${topCategory[0]}** is your biggest expense at ${formatAmount(topCategory[1])} (${topPercent}% of total). ${topPercent > 50 ? 'That\'s more than half your spending!' : ''}`,
            severity: topPercent > 60 ? 'warning' : 'info',
            priority: 6
        });
    }

    // Full breakdown
    const breakdownLines = sortedCategories.map(([cat, amount]) => {
        const pct = Math.round((amount / totalSpent) * 100);
        return `• ${cat}: ${formatAmount(amount)} (${pct}%)`;
    }).join('\n');

    insights.push({
        type: 'expenses',
        icon: '📊',
        title: 'Spending Breakdown',
        message: `Here's where your money went:\n${breakdownLines}\n\nTotal: ${formatAmount(totalSpent)} across ${expenses.length} expenses.`,
        severity: 'info',
        priority: 5
    });

    // Biggest single expense
    const biggest = expenses.reduce((max, e) => (e.amount || 0) > (max.amount || 0) ? e : max, expenses[0]);
    if (biggest) {
        insights.push({
            type: 'expenses',
            icon: '💸',
            title: 'Biggest Single Expense',
            message: `Your largest expense was "**${biggest.description || 'Untitled'}**" at ${formatAmount(biggest.amount || 0)} in ${biggest.category || 'Other'}.`,
            severity: 'info',
            priority: 3
        });
    }

    // Per-person spending (who paid most)
    if (members && members.length > 1) {
        const paidByPerson = {};
        expenses.forEach(e => {
            const payer = e.paidByName || e.paidBy || 'Unknown';
            paidByPerson[payer] = (paidByPerson[payer] || 0) + (e.amount || 0);
        });

        const sortedPayers = Object.entries(paidByPerson).sort(([, a], [, b]) => b - a);
        if (sortedPayers.length > 0) {
            const topPayer = sortedPayers[0];
            insights.push({
                type: 'expenses',
                icon: '👤',
                title: 'Top Payer',
                message: `**${topPayer[0]}** has paid the most at ${formatAmount(topPayer[1])}. ${sortedPayers.length > 1 ? `Followed by ${sortedPayers[1][0]} (${formatAmount(sortedPayers[1][1])}).` : ''}`,
                severity: 'info',
                priority: 4
            });
        }
    }

    return insights;
};

// ==================== SETTLEMENT STATUS ====================

const analyzeSettlements = (expenses, members, formatAmount = defaultFormat) => {
    if (!expenses || expenses.length === 0 || !members || members.length < 2) {
        return {
            type: 'settlements',
            icon: '🤝',
            title: 'No Settlements Needed',
            message: 'Not enough data to calculate settlements. Add group expenses with splits first!',
            severity: 'info'
        };
    }

    const insights = [];

    // Calculate balances
    const balances = {};
    members.forEach(m => {
        const id = m.userId || m.id || m.name;
        balances[id] = { name: m.displayName || m.name || 'Unknown', paid: 0, owes: 0 };
    });

    expenses.forEach(e => {
        const payerId = e.paidBy || '';
        if (balances[payerId]) {
            balances[payerId].paid += (e.amount || 0);
        }

        // Split equally among all members if no specific splits
        const splits = e.splits || [];
        if (splits.length > 0) {
            splits.forEach(s => {
                const uid = s.userId || s.id;
                if (balances[uid]) {
                    balances[uid].owes += (s.amount || 0);
                }
            });
        } else {
            const perPerson = (e.amount || 0) / members.length;
            Object.keys(balances).forEach(id => {
                balances[id].owes += perPerson;
            });
        }
    });

    // Net balances
    const nets = Object.entries(balances).map(([id, b]) => ({
        id,
        name: b.name,
        net: Math.round((b.paid - b.owes) * 100) / 100
    }));

    const creditors = nets.filter(n => n.net > 0).sort((a, b) => b.net - a.net);
    const debtors = nets.filter(n => n.net < 0).sort((a, b) => a.net - b.net);

    if (creditors.length === 0 && debtors.length === 0) {
        insights.push({
            type: 'settlements',
            icon: '✅',
            title: 'All Settled Up!',
            message: 'Everyone is square! No pending payments.',
            severity: 'success',
            priority: 3
        });
        return insights;
    }

    // Settlement suggestions (simplified)
    const settlements = [];
    const creds = creditors.map(c => ({ ...c }));
    const debts = debtors.map(d => ({ ...d, net: Math.abs(d.net) }));

    let ci = 0, di = 0;
    while (ci < creds.length && di < debts.length) {
        const amount = Math.min(creds[ci].net, debts[di].net);
        if (amount > 0) {
            settlements.push({
                from: debts[di].name,
                to: creds[ci].name,
                amount: Math.round(amount)
            });
        }
        creds[ci].net -= amount;
        debts[di].net -= amount;
        if (creds[ci].net <= 0.01) ci++;
        if (debts[di].net <= 0.01) di++;
    }

    if (settlements.length > 0) {
        const lines = settlements.map(s =>
            `• **${s.from}** → **${s.to}**: ${formatAmount(s.amount)}`
        ).join('\n');

        insights.push({
            type: 'settlements',
            icon: '💳',
            title: 'Who Owes Who?',
            message: `Here's the simplest way to settle up:\n${lines}\n\n${settlements.length} payment${settlements.length > 1 ? 's' : ''} needed to square everyone up.`,
            severity: 'warning',
            priority: 7
        });
    }

    return insights;
};

// ==================== TRIP INSIGHTS ====================

const analyzeTripData = (trips, budgetData, formatAmount = defaultFormat) => {
    if (!trips || trips.length === 0) {
        return {
            type: 'trips',
            icon: '✈️',
            title: 'No Trips Planned',
            message: 'No destinations added yet. Add trips in the Trip Planner to get cost insights!',
            severity: 'info'
        };
    }

    const insights = [];
    const totalEstCost = trips.reduce((sum, t) => sum + (t.estimatedCost || 0), 0);

    insights.push({
        type: 'trips',
        icon: '🗺️',
        title: 'Trip Overview',
        message: `You have **${trips.length}** destination${trips.length > 1 ? 's' : ''} planned with a combined estimated cost of ${formatAmount(totalEstCost)}.`,
        severity: 'info',
        priority: 3
    });

    // Budget fit
    if (budgetData && budgetData.totalBudget) {
        const budgetFit = totalEstCost <= budgetData.totalBudget;
        insights.push({
            type: 'trips',
            icon: budgetFit ? '✅' : '⚠️',
            title: budgetFit ? 'Trips Fit Your Budget' : 'Trips Exceed Budget',
            message: budgetFit
                ? `Your planned trips (${formatAmount(totalEstCost)}) fit within your ${formatAmount(budgetData.totalBudget)} budget. ${formatAmount(budgetData.totalBudget - totalEstCost)} to spare!`
                : `Your planned trips (${formatAmount(totalEstCost)}) exceed your ${formatAmount(budgetData.totalBudget)} budget by ${formatAmount(totalEstCost - budgetData.totalBudget)}. Consider trimming a destination.`,
            severity: budgetFit ? 'success' : 'warning',
            priority: budgetFit ? 3 : 7
        });
    }

    // Cheapest & most expensive trip
    if (trips.length > 1) {
        const sorted = [...trips].sort((a, b) => (a.estimatedCost || 0) - (b.estimatedCost || 0));
        const cheapest = sorted[0];
        const priciest = sorted[sorted.length - 1];

        insights.push({
            type: 'trips',
            icon: '💎',
            title: 'Trip Comparison',
            message: `Cheapest: **${cheapest.title}** (${formatAmount(cheapest.estimatedCost || 0)})\nMost expensive: **${priciest.title}** (${formatAmount(priciest.estimatedCost || 0)})`,
            severity: 'info',
            priority: 2
        });
    }

    return insights;
};

// ==================== SMART TIPS ====================

const generateSmartTips = (context, formatAmount = defaultFormat) => {
    const tips = [];
    const { expenses, budgetData, members, trips } = context;

    const totalSpent = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const budget = budgetData?.totalBudget || 0;

    // Tip: Large single expense
    if (expenses && expenses.length > 0) {
        const avgExpense = totalSpent / expenses.length;
        const outliers = expenses.filter(e => (e.amount || 0) > avgExpense * 3);
        if (outliers.length > 0) {
            tips.push({
                type: 'tip',
                icon: '💡',
                title: 'Big Expense Alert',
                message: `You have ${outliers.length} expense${outliers.length > 1 ? 's' : ''} that ${outliers.length > 1 ? 'are' : 'is'} 3x above your average (${formatAmount(Math.round(avgExpense))}). Consider sharing these costs more evenly.`,
                severity: 'info',
                priority: 4
            });
        }
    }

    // Tip: Unequal spending
    if (members && members.length > 1 && expenses && expenses.length > 0) {
        const paidByPerson = {};
        expenses.forEach(e => {
            const payer = e.paidBy || 'Unknown';
            paidByPerson[payer] = (paidByPerson[payer] || 0) + (e.amount || 0);
        });
        const amounts = Object.values(paidByPerson);
        const max = Math.max(...amounts);
        const min = Math.min(...amounts);
        if (max > 0 && min >= 0 && max > min * 3) {
            tips.push({
                type: 'tip',
                icon: '⚖️',
                title: 'Uneven Payments',
                message: 'One person is paying significantly more than others. Consider rotating who pays or settling up soon to keep things fair.',
                severity: 'warning',
                priority: 6
            });
        }
    }

    // Tip: No expenses this week
    if (expenses && expenses.length > 0) {
        const now = Date.now();
        const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
        const recentExpenses = expenses.filter(e => {
            const ts = e.createdAt?.seconds ? e.createdAt.seconds * 1000 : new Date(e.createdAt).getTime();
            return ts > weekAgo;
        });
        if (recentExpenses.length === 0) {
            tips.push({
                type: 'tip',
                icon: '📅',
                title: 'Quiet Week',
                message: 'No expenses logged in the past 7 days. Don\'t forget to log shared costs to keep everyone on the same page!',
                severity: 'info',
                priority: 3
            });
        }
    }

    // Tip: Budget almost done but trip remaining
    if (budget > 0 && totalSpent > budget * 0.9 && trips && trips.length > 0) {
        tips.push({
            type: 'tip',
            icon: '🎯',
            title: 'Budget-Trip Mismatch',
            message: 'You\'ve used 90%+ of your budget but still have planned trips. Consider extending your budget or adjusting trip plans.',
            severity: 'warning',
            priority: 8
        });
    }

    // General tips if nothing specific
    if (tips.length === 0) {
        tips.push({
            type: 'tip',
            icon: '✨',
            title: 'You\'re All Set!',
            message: 'Everything looks good! Keep logging expenses and I\'ll alert you if anything needs attention.',
            severity: 'success',
            priority: 1
        });
    }

    return tips;
};

// ==================== QUERY MATCHING ====================

const QUERY_PATTERNS = [
    { keywords: ['budget', 'spend', 'money', 'remaining', 'left', 'over budget', 'how much'], category: 'budget' },
    { keywords: ['expense', 'breakdown', 'category', 'spent on', 'where', 'spending'], category: 'expenses' },
    { keywords: ['owe', 'settle', 'pay', 'debt', 'balance', 'who owes', 'settlement'], category: 'settlements' },
    { keywords: ['trip', 'travel', 'destination', 'plan', 'hotel', 'flight', 'itinerary'], category: 'trips' },
    { keywords: ['tip', 'suggest', 'advice', 'help', 'recommend', 'improve', 'save'], category: 'tips' },
    { keywords: ['all', 'everything', 'summary', 'overview', 'report', 'full'], category: 'all' }
];

export const answerQuery = (query, context) => {
    const q = query.toLowerCase().trim();

    // Match to category
    let matchedCategory = null;
    let bestScore = 0;

    for (const pattern of QUERY_PATTERNS) {
        const score = pattern.keywords.filter(kw => q.includes(kw)).length;
        if (score > bestScore) {
            bestScore = score;
            matchedCategory = pattern.category;
        }
    }

    // Fallback
    if (!matchedCategory) matchedCategory = 'all';

    return generateCategoryInsights(matchedCategory, context);
};

// ==================== MAIN GENERATORS ====================

const generateCategoryInsights = (category, context, formatAmount = defaultFormat) => {
    const { expenses, budgetData, members, trips } = context;

    switch (category) {
        case 'budget':
            return flattenInsights(analyzeBudgetHealth(budgetData, expenses || [], formatAmount));
        case 'expenses':
            return flattenInsights(analyzeExpenses(expenses, members, formatAmount));
        case 'settlements':
            return flattenInsights(analyzeSettlements(expenses, members, formatAmount));
        case 'trips':
            return flattenInsights(analyzeTripData(trips, budgetData, formatAmount));
        case 'tips':
            return flattenInsights(generateSmartTips(context, formatAmount));
        case 'all':
        default:
            return generateAllInsights(context, formatAmount);
    }
};

export const generateAllInsights = (context, formatAmount = defaultFormat) => {
    const { expenses, budgetData, members, trips } = context;
    const all = [
        ...flattenInsights(analyzeBudgetHealth(budgetData, expenses || [], formatAmount)),
        ...flattenInsights(analyzeExpenses(expenses, members, formatAmount)),
        ...flattenInsights(analyzeSettlements(expenses, members, formatAmount)),
        ...flattenInsights(analyzeTripData(trips, budgetData, formatAmount)),
        ...flattenInsights(generateSmartTips(context, formatAmount))
    ];

    // Sort by priority (highest first) and take top insights
    return all.sort((a, b) => (b.priority || 0) - (a.priority || 0));
};

export const getTopInsights = (context, formatAmount = defaultFormat, count = 3) => {
    const all = generateAllInsights(context, formatAmount);
    return all.slice(0, count);
};

export const getQuickActions = (context) => {
    const actions = [
        { id: 'budget', label: '💰 Budget Health', query: 'budget' },
        { id: 'expenses', label: '📊 Expense Breakdown', query: 'expenses' },
        { id: 'settlements', label: '🤝 Who Owes Who?', query: 'settlements' },
    ];

    if (context.trips && context.trips.length > 0) {
        actions.push({ id: 'trips', label: '✈️ Trip Insights', query: 'trips' });
    }

    actions.push({ id: 'tips', label: '💡 Smart Tips', query: 'tips' });
    actions.push({ id: 'all', label: '📋 Full Report', query: 'all' });

    return actions;
};

// Helper to ensure we always return an array
const flattenInsights = (result) => {
    if (Array.isArray(result)) return result;
    return [result];
};
