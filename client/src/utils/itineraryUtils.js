// Itinerary utility functions - Date, time, and budget helpers

/**
 * Format date to readable string
 */
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Calculate number of days between two dates
 */
export const calculateDaysBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end day
};

/**
 * Generate empty day structure
 */
export const createEmptyDay = (dayNumber, date) => {
    return {
        dayNumber,
        date,
        activities: [],
        budgetUsed: 0,
        transportation: null,
        notes: ''
    };
};

/**
 * Time slot definitions
 */
export const TIME_SLOTS = {
    MORNING: 'morning',
    AFTERNOON: 'afternoon',
    EVENING: 'evening'
};

export const TIME_SLOT_LABELS = {
    morning: { label: 'Morning', icon: '🌅', time: '6:00 AM - 12:00 PM' },
    afternoon: { label: 'Afternoon', icon: '☀️', time: '12:00 PM - 6:00 PM' },
    evening: { label: 'Evening', icon: '🌙', time: '6:00 PM - 12:00 AM' }
};

/**
 * Get activities by time slot
 */
export const getActivitiesBySlot = (activities, timeSlot) => {
    return activities.filter(activity => activity.timeSlot === timeSlot);
};

/**
 * Calculate total cost for a day
 */
export const calculateDayCost = (day) => {
    const activitiesCost = day.activities.reduce((sum, act) => sum + (act.cost || 0), 0);
    const transportCost = day.transportation?.cost || 0;
    return activitiesCost + transportCost;
};

/**
 * Calculate total itinerary cost
 */
export const calculateTotalCost = (days) => {
    return days.reduce((sum, day) => sum + calculateDayCost(day), 0);
};

/**
 * Get budget status (on track, over, under)
 */
export const getBudgetStatus = (spent, budgeted) => {
    const percentage = (spent / budgeted) * 100;

    if (percentage <= 80) {
        return { status: 'under', color: 'green', message: 'Under budget' };
    } else if (percentage <= 100) {
        return { status: 'ontrack', color: 'yellow', message: 'On track' };
    } else if (percentage <= 110) {
        return { status: 'warning', color: 'orange', message: 'Slightly over budget' };
    } else {
        return { status: 'over', color: 'red', message: 'Over budget' };
    }
};

/**
 * Activity templates for common activities
 */
export const ACTIVITY_TEMPLATES = [
    {
        title: 'Breakfast',
        duration: 1,
        cost: 500,
        timeSlot: 'morning',
        category: 'food'
    },
    {
        title: 'Lunch',
        duration: 1.5,
        cost: 800,
        timeSlot: 'afternoon',
        category: 'food'
    },
    {
        title: 'Dinner',
        duration: 2,
        cost: 1200,
        timeSlot: 'evening',
        category: 'food'
    },
    {
        title: 'Sightseeing',
        duration: 3,
        cost: 1000,
        timeSlot: 'morning',
        category: 'activity'
    },
    {
        title: 'Museum Visit',
        duration: 2,
        cost: 500,
        timeSlot: 'afternoon',
        category: 'activity'
    },
    {
        title: 'Shopping',
        duration: 2,
        cost: 2000,
        timeSlot: 'afternoon',
        category: 'shopping'
    },
    {
        title: 'Beach/Park',
        duration: 2,
        cost: 0,
        timeSlot: 'afternoon',
        category: 'activity'
    },
    {
        title: 'Night Market',
        duration: 2,
        cost: 1000,
        timeSlot: 'evening',
        category: 'food'
    }
];

/**
 * Get suggested activities based on time slot
 */
export const getSuggestedActivities = (timeSlot, remainingBudget) => {
    return ACTIVITY_TEMPLATES
        .filter(act => act.timeSlot === timeSlot && act.cost <= remainingBudget)
        .slice(0, 3); // Top 3 suggestions
};

/**
 * AI: Predict daily spending based on patterns
 */
export const predictDailySpending = (pastDays) => {
    if (!pastDays || pastDays.length === 0) return 0;

    const totalSpent = pastDays.reduce((sum, day) => sum + calculateDayCost(day), 0);
    return Math.round(totalSpent / pastDays.length);
};

/**
 * AI: Get smart budget recommendation
 */
export const getSmartBudgetRecommendation = (totalBudget, days, currentSpending, currencySymbol = '') => {
    const budgetPerDay = totalBudget / days.length;
    const avgSpent = predictDailySpending(days.slice(0, -1)); // Past days only
    const remainingDays = days.length - days.filter(d => d.budgetUsed > 0).length;
    const remainingBudget = totalBudget - currentSpending;
    const recommendedDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;

    return {
        original: Math.round(budgetPerDay),
        current: Math.round(avgSpent),
        recommended: Math.round(recommendedDailyBudget),
        message: recommendedDailyBudget > budgetPerDay
            ? `You're under budget! You can spend ${currencySymbol}${Math.round(recommendedDailyBudget)}/day`
            : `Stay within ${currencySymbol}${Math.round(recommendedDailyBudget)}/day to meet budget`
    };
};

/**
 * Generate date range array
 */
export const generateDateRange = (startDate, endDate) => {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }

    return dates;
};

/**
 * Validate activity data
 */
export const validateActivity = (activity) => {
    const errors = [];

    if (!activity.title || activity.title.trim() === '') {
        errors.push('Activity title is required');
    }

    if (!activity.timeSlot) {
        errors.push('Time slot is required');
    }

    if (activity.duration && activity.duration <= 0) {
        errors.push('Duration must be positive');
    }

    if (activity.cost && activity.cost < 0) {
        errors.push('Cost cannot be negative');
    }

    return { isValid: errors.length === 0, errors };
};
