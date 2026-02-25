import { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';
import { addActivity, removeActivity } from '../../services/itineraryService';
import { getActivitiesBySlot, calculateDayCost } from '../../utils/itineraryUtils';
import ActivitySlot from './ActivitySlot';
import AddActivityModal from './AddActivityModal';

const DayCard = ({ day, dayIndex, itineraryId, dailyBudget, onUpdate }) => {
    const { formatAmount } = useCurrency();
    const { addToast } = useToast();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

    const dayCost = calculateDayCost(day);
    const budgetRemaining = dailyBudget - dayCost;
    const budgetPercentage = dailyBudget > 0 ? (dayCost / dailyBudget) * 100 : 0;

    const getBudgetColor = () => {
        if (budgetPercentage <= 80) return 'green';
        if (budgetPercentage <= 100) return 'yellow';
        return 'red';
    };

    // Safe Tailwind mapping
    const colorClasses = {
        green: {
            text: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-500'
        },
        yellow: {
            text: 'text-yellow-600 dark:text-yellow-400',
            bg: 'bg-yellow-500'
        },
        red: {
            text: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-500'
        }
    };

    const currentColor = colorClasses[getBudgetColor()];

    const handleAddActivity = (timeSlot) => {
        setSelectedTimeSlot(timeSlot);
        setShowAddModal(true);
    };

    const handleActivityAdded = async (activity) => {
        const result = await addActivity(itineraryId, dayIndex, selectedTimeSlot, activity);

        if (result.success) {
            addToast('Activity added!', 'success');
            onUpdate();
            setShowAddModal(false);
        } else {
            addToast('Failed to add activity', 'error');
        }
    };

    const handleRemoveActivity = async (activityId) => {
        const result = await removeActivity(itineraryId, dayIndex, activityId);

        if (result.success) {
            addToast('Activity removed', 'success');
            onUpdate();
        } else {
            addToast('Failed to remove activity', 'error');
        }
    };

    return (
        <>
            <div className="bg-white/20 dark:bg-white/[0.05] rounded-2xl border border-gray-200/40 dark:border-white/10 overflow-hidden">

                {/* Header */}
                <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/30 dark:hover:bg-white/[0.08] transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-400/20 rounded-xl flex items-center justify-center">
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                                {day.dayNumber}
                            </span>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">
                                Day {day.dayNumber}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(day.date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Spent</div>
                            <div className={`text-lg font-bold ${currentColor.text}`}>
                                {formatAmount(dayCost)}
                            </div>
                            <div className="text-xs text-gray-400">
                                of {formatAmount(dailyBudget)}
                            </div>
                        </div>

                        <span className={`material-symbols-outlined text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="px-4 pb-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className={`${currentColor.bg} h-2 rounded-full transition-all`}
                            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="px-4 pb-4 space-y-4">

                        <ActivitySlot
                            timeSlot="evening"
                            activities={getActivitiesBySlot(day.activities, 'evening')}
                            onAddActivity={() => handleAddActivity('evening')}
                            onRemoveActivity={handleRemoveActivity}
                        />

                        {budgetRemaining > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex items-start gap-3">
                                <span className="text-xl shrink-0">💡</span>
                                <div className="text-sm">
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        AI Tip
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400 mt-1">
                                        You have {formatAmount(budgetRemaining)} remaining for today.
                                        {budgetRemaining > 1000 &&
                                            ' Consider adding more activities or saving for tomorrow.'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {budgetPercentage > 100 && (
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 flex items-start gap-3">
                                <span className="text-xl shrink-0">⚠️</span>
                                <div className="text-sm">
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        Budget Alert
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400 mt-1">
                                        You're {formatAmount(Math.abs(budgetRemaining))} over budget for today.
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>

            {showAddModal && (
                <AddActivityModal
                    timeSlot={selectedTimeSlot}
                    budgetRemaining={budgetRemaining}
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleActivityAdded}
                />
            )}
        </>
    );
};

export default DayCard;