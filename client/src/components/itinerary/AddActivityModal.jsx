import { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';
import { ACTIVITY_TEMPLATES, getSuggestedActivities, validateActivity } from '../../utils/itineraryUtils';
import { TIME_SLOT_LABELS } from '../../utils/itineraryUtils';

const AddActivityModal = ({ timeSlot, budgetRemaining, onClose, onAdd, savedActivities = [] }) => {
    const { formatAmount, currencySymbol } = useCurrency();
    const { addToast } = useToast();
    const [mode, setMode] = useState('custom'); // 'custom' or 'template'
    const [formData, setFormData] = useState({
        title: '',
        duration: '',
        cost: '',
        location: '',
        notes: ''
    });

    const slotInfo = TIME_SLOT_LABELS[timeSlot];
    const suggestions = getSuggestedActivities(timeSlot, budgetRemaining);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTemplateSelect = (template) => {
        setFormData({
            title: template.title,
            duration: template.duration.toString(),
            cost: template.cost.toString(),
            location: template.location || '',
            notes: ''
        });
        setMode('custom');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const activity = {
            title: formData.title,
            duration: parseFloat(formData.duration) || 0,
            cost: parseFloat(formData.cost) || 0,
            location: formData.location || null,
            notes: formData.notes || '',
            timeSlot
        };

        const validation = validateActivity(activity);

        if (!validation.isValid) {
            addToast(validation.errors.join('\n'), 'error');
            return;
        }

        onAdd(activity);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{slotInfo.icon}</span>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Add {slotInfo.label} Activity
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Budget remaining: {formatAmount(budgetRemaining)}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Mode Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMode('custom')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'custom'
                                ? 'bg-amber-400 text-black'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Custom Activity
                        </button>
                        <button
                            onClick={() => setMode('template')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'template'
                                ? 'bg-amber-400 text-black'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Quick Add
                        </button>
                        <button
                            onClick={() => setMode('saved')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'saved'
                                ? 'bg-amber-400 text-black'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Saved Places
                        </button>
                    </div>

                    {/* Templates View */}
                    {mode === 'template' && (
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                🤖 AI Suggested Activities
                            </h4>
                            {suggestions.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {suggestions.map((template, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleTemplateSelect(template)}
                                            className="text-left p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200/40 dark:border-purple-400/20 rounded-xl hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        {template.title}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {template.duration}h · {formatAmount(template.cost)}
                                                    </div>
                                                </div>
                                                <span className="material-symbols-outlined text-purple-500">add_circle</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    No suggestions available within your budget
                                </div>
                            )}
                        </div>
                    )}

                    {/* Saved Places View */}
                    {mode === 'saved' && (
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                🔖 Your Saved Places
                            </h4>
                            {savedActivities.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {savedActivities.map((place, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleTemplateSelect(place)}
                                            className="text-left p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/40 dark:border-amber-400/20 rounded-xl hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        {place.title}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {place.duration}h · {formatAmount(place.cost)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {place.location}
                                                    </div>
                                                </div>
                                                <span className="material-symbols-outlined text-amber-500">add_circle</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <span className="material-symbols-outlined text-4xl mb-2 text-gray-300 dark:text-gray-600 block">bookmark_border</span>
                                    No saved places. Browse the Activities tab and save places for your trip.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Custom Form */}
                    {mode === 'custom' && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Activity Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Visit Eiffel Tower"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Duration (hours)
                                    </label>
                                    <input
                                        type="number"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        placeholder="2"
                                        step="0.5"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Cost ({currencySymbol})
                                    </label>
                                    <input
                                        type="number"
                                        name="cost"
                                        value={formData.cost}
                                        onChange={handleInputChange}
                                        placeholder="1000"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Champ de Mars, Paris"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    placeholder="Any additional details..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                                />
                            </div>

                            {/* AI Budget Warning */}
                            {parseFloat(formData.cost) > budgetRemaining && (
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 flex items-start gap-2">
                                    <span className="material-symbols-outlined text-red-500">warning</span>
                                    <div className="text-sm text-red-700 dark:text-red-400">
                                        This activity exceeds your remaining budget by {formatAmount(parseFloat(formData.cost) - budgetRemaining)}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-xl transition-colors"
                                >
                                    Add Activity
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddActivityModal;
