import { TIME_SLOT_LABELS } from '../../utils/itineraryUtils';
import { useCurrency } from '../../context/CurrencyContext';
import { useTranslation } from 'react-i18next';

const ActivitySlot = ({ timeSlot, activities, onAddActivity, onRemoveActivity }) => {
    const { formatAmount } = useCurrency();
    const { t } = useTranslation();
    const slotInfo = TIME_SLOT_LABELS[timeSlot];

    const getSlotStyles = () => {
        switch (timeSlot) {
            case 'morning': return {
                btnBg: 'bg-amber-400/20 hover:bg-amber-400/30',
                btnText: 'text-amber-700 dark:text-amber-400',
                cardBg: 'bg-amber-50 dark:bg-amber-900/10',
                cardBorder: 'border-amber-200/40 dark:border-amber-400/20'
            };
            case 'afternoon': return {
                btnBg: 'bg-orange-400/20 hover:bg-orange-400/30',
                btnText: 'text-orange-700 dark:text-orange-400',
                cardBg: 'bg-orange-50 dark:bg-orange-900/10',
                cardBorder: 'border-orange-200/40 dark:border-orange-400/20'
            };
            case 'evening': return {
                btnBg: 'bg-purple-400/20 hover:bg-purple-400/30',
                btnText: 'text-purple-700 dark:text-purple-400',
                cardBg: 'bg-purple-50 dark:bg-purple-900/10',
                cardBorder: 'border-purple-200/40 dark:border-purple-400/20'
            };
            default: return {
                btnBg: 'bg-gray-400/20 hover:bg-gray-400/30',
                btnText: 'text-gray-700 dark:text-gray-400',
                cardBg: 'bg-gray-50 dark:bg-gray-900/10',
                cardBorder: 'border-gray-200/40 dark:border-gray-400/20'
            };
        }
    };

    const styles = getSlotStyles();

    return (
        <div className="space-y-2">
            {/* Time Slot Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{slotInfo.icon}</span>
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{t(`itineraryBuilder.${timeSlot}Label`, slotInfo.label)}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{slotInfo.time}</p>
                    </div>
                </div>

                <button
                    onClick={onAddActivity}
                    className={`px-3 py-1.5 ${styles.btnBg} ${styles.btnText} rounded-lg text-sm font-medium transition-colors flex items-center gap-1`}
                >
                    <span className="material-symbols-outlined text-base">add</span>
                    {t('itineraryBuilder.add')}
                </button>
            </div>

            {/* Activities List */}
            {activities && activities.length > 0 ? (
                <div className="space-y-2">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className={`${styles.cardBg} border ${styles.cardBorder} rounded-xl p-3 group hover:shadow-md transition-all`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-semibold text-gray-900 dark:text-white">
                                            {activity.title}
                                        </h5>
                                        {activity.cost > 0 && (
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                {formatAmount(activity.cost)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                        {activity.duration && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">schedule</span>
                                                {activity.duration}h
                                            </span>
                                        )}
                                        {activity.location && (
                                            <span className="flex items-center gap-1 truncate">
                                                <span className="material-symbols-outlined text-sm">location_on</span>
                                                {activity.location.name || activity.location}
                                            </span>
                                        )}
                                    </div>

                                    {activity.notes && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                            {activity.notes}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => onRemoveActivity(activity.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500 italic">
                    {t('itineraryBuilder.noActivities', { slot: t(`itineraryBuilder.${timeSlot}Label`, slotInfo.label).toLowerCase() })}
                </div>
            )}
        </div>
    );
};

export default ActivitySlot;
