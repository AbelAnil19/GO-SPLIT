import { useState, useEffect } from 'react';
import { useAuth } from '../../firebase/authContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import {
    getGroupItineraries,
    createItinerary,
    deleteItinerary,
    calculateBudgetBreakdown
} from '../../services/itineraryService';
import {
    calculateDaysBetween,
    generateDateRange,
    createEmptyDay,
    calculateTotalCost,
    getBudgetStatus
} from '../../utils/itineraryUtils';
import DayCard from './DayCard';
import ConfirmationModal from '../ConfirmationModal';

const ItineraryBuilder = ({ groupId, groupData, savedTrips = [], activeTrip = null }) => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const { formatAmount, currencySymbol } = useCurrency();
    const { t } = useTranslation();

    const [itineraries, setItineraries] = useState([]);
    const [activeItinerary, setActiveItinerary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [errors, setErrors] = useState({});
    const [dateConflict, setDateConflict] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, itineraryId: null, destName: '' });
    const [timeFilter, setTimeFilter] = useState('upcoming'); // Add time filter

    // New itinerary form
    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [totalBudget, setTotalBudget] = useState('');
    const [selectedTripId, setSelectedTripId] = useState('');

    // Auto-fill from activeTrip
    useEffect(() => {
        if (activeTrip && itineraries.length === 0) {
            setDestination(activeTrip.title || '');
            setStartDate(activeTrip.startDate || '');
            setEndDate(activeTrip.endDate || '');
            setTotalBudget(activeTrip.estimatedCost ? String(activeTrip.estimatedCost) : '');
            setSelectedTripId(activeTrip.id || '');
            setShowCreateForm(true);
        }
    }, [activeTrip]);

    // Load existing itineraries
    useEffect(() => {
        loadItineraries();
    }, [groupId]);

    const loadItineraries = async () => {
        setLoading(true);
        const result = await getGroupItineraries(groupId);

        if (result.success) {
            setItineraries(result.data);
            // Refresh active itinerary with updated data, or auto-select first
            setActiveItinerary(prev => {
                if (prev) {
                    // Find the updated version of the currently active itinerary
                    const updated = result.data.find(i => i.id === prev.id);
                    return updated || (result.data.length > 0 ? result.data[0] : null);
                }
                return result.data.length > 0 ? result.data[0] : null;
            });
        }

        setLoading(false);
    };

    // Check date conflicts
    const checkDateConflict = (newStart, newEnd) => {
        if (!newStart || !newEnd) return null;
        const start = new Date(newStart);
        const end = new Date(newEnd);

        for (const itin of itineraries) {
            const existingStart = new Date(itin.startDate);
            const existingEnd = new Date(itin.endDate);

            // Check overlap: start1 <= end2 && start2 <= end1
            if (start <= existingEnd && existingStart <= end) {
                const overlapStart = new Date(Math.max(start, existingStart));
                const overlapEnd = new Date(Math.min(end, existingEnd));
                const overlapDays = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
                return {
                    destination: itin.destination,
                    overlapDays,
                    overlapStart: overlapStart.toLocaleDateString(),
                    overlapEnd: overlapEnd.toLocaleDateString()
                };
            }
        }
        return null;
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!destination.trim()) {
            newErrors.destination = 'Destination is required';
        } else if (destination.trim().length < 2) {
            newErrors.destination = 'Destination must be at least 2 characters';
        }

        if (!startDate) {
            newErrors.startDate = 'Start date is required';
        } else if (new Date(startDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
            newErrors.startDate = 'Start date cannot be in the past';
        }

        if (!endDate) {
            newErrors.endDate = 'End date is required';
        } else if (startDate && new Date(endDate) <= new Date(startDate)) {
            newErrors.endDate = 'End date must be after start date';
        }

        if (!totalBudget) {
            newErrors.totalBudget = 'Budget is required';
        } else if (parseFloat(totalBudget) < 5) {
            newErrors.totalBudget = `Budget must be at least ${formatAmount(5)}`;
        } else if (parseFloat(totalBudget) > 10000000) {
            newErrors.totalBudget = 'Budget seems unrealistic';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Create new itinerary
    const handleCreateItinerary = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            addToast('Please fix the errors in the form', 'error');
            return;
        }

        const days = calculateDaysBetween(startDate, endDate);
        const dates = generateDateRange(startDate, endDate);
        const emptyDays = dates.map((date, index) => createEmptyDay(index + 1, date));

        setIsCreating(true);

        const result = await createItinerary({
            groupId,
            createdBy: currentUser.uid,
            destination,
            startDate,
            endDate,
            totalBudget: parseFloat(totalBudget),
            days: emptyDays
        });

        setIsCreating(false);

        if (result.success) {
            addToast(`Itinerary for ${destination} created!`, 'success');
            await loadItineraries();
            // Auto-select the new itinerary
            const freshResult = await getGroupItineraries(groupId);
            if (freshResult.success) {
                const newItin = freshResult.data.find(i => i.destination === destination);
                if (newItin) setActiveItinerary(newItin);
            }
            // Reset form
            setDestination('');
            setStartDate('');
            setEndDate('');
            setTotalBudget('');
            setSelectedTripId('');
            setErrors({});
            setDateConflict(null);
            setShowCreateForm(false);
        } else {
            addToast('Failed to create itinerary', 'error');
        }
    };

    // Delete itinerary
    const confirmDeleteItinerary = (itineraryId, destName) => {
        setDeleteModal({ isOpen: true, itineraryId, destName });
    };

    const handleDeleteItinerary = async () => {
        const { itineraryId, destName } = deleteModal;
        setDeleteModal({ isOpen: false, itineraryId: null, destName: '' });

        const result = await deleteItinerary(itineraryId);
        if (result.success) {
            addToast(`Itinerary for ${destName} deleted!`, 'success');
            if (activeItinerary?.id === itineraryId) {
                setActiveItinerary(null);
            }
            await loadItineraries();
        } else {
            addToast('Failed to delete itinerary', 'error');
        }
    };

    // Handle date change with conflict detection
    const handleDateChange = (type, value) => {
        if (type === 'start') {
            setStartDate(value);
            setErrors({ ...errors, startDate: '' });
            if (endDate) {
                setDateConflict(checkDateConflict(value, endDate));
            }
        } else {
            setEndDate(value);
            setErrors({ ...errors, endDate: '' });
            if (startDate) {
                setDateConflict(checkDateConflict(startDate, value));
            }
        }
    };

    // Calculate stats for active itinerary
    const stats = activeItinerary ? {
        totalDays: activeItinerary.days.length,
        totalSpent: calculateTotalCost(activeItinerary.days),
        budgetRemaining: activeItinerary.totalBudget - calculateTotalCost(activeItinerary.days),
        budgetStatus: getBudgetStatus(
            calculateTotalCost(activeItinerary.days),
            activeItinerary.totalBudget
        )
    } : null;

    const budgetBreakdown = activeItinerary
        ? calculateBudgetBreakdown(activeItinerary.totalBudget, activeItinerary.days.length)
        : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
            </div>
        );
    }

    // Creation Form Component
    const renderCreateForm = () => (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white/20 dark:bg-white/[0.05] rounded-2xl p-8 backdrop-blur-sm border border-gray-200/40 dark:border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <div className="text-center flex-1">
                        <span className="text-5xl">🗓️</span>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
                            {itineraries.length > 0 ? t('itineraryBuilder.addAnotherItinerary') : t('itineraryBuilder.createTripItinerary')}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            {t('itineraryBuilder.planYourTrip')}
                        </p>
                    </div>
                    {itineraries.length > 0 && (
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    )}
                </div>

                <form onSubmit={handleCreateItinerary} className="space-y-4">
                    {/* Trip Selector */}
                    {savedTrips.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-500 text-base">sync</span>
                                    {t('itineraryBuilder.importFromSaved')}
                                </span>
                            </label>
                            <select
                                value={selectedTripId}
                                onChange={(e) => {
                                    const tripId = e.target.value;
                                    setSelectedTripId(tripId);
                                    if (tripId) {
                                        const trip = savedTrips.find(t => t.id === tripId);
                                        if (trip) {
                                            setDestination(trip.title || '');
                                            setStartDate(trip.startDate || '');
                                            setEndDate(trip.endDate || '');
                                            setTotalBudget(trip.estimatedCost ? String(trip.estimatedCost) : '');
                                            setErrors({});
                                            // Check conflicts
                                            if (trip.startDate && trip.endDate) {
                                                setDateConflict(checkDateConflict(trip.startDate, trip.endDate));
                                            }
                                        }
                                        setTotalBudget('');
                                        setDateConflict(null);
                                    }
                                }}
                                className="w-full px-4 py-3 rounded-xl border border-amber-400/30 bg-amber-400/5 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer"
                            >
                                <option value="" className="dark:bg-gray-800">{t('itineraryBuilder.selectSavedDestination')}</option>
                                {savedTrips.map(trip => (
                                    <option key={trip.id} value={trip.id} className="dark:bg-gray-800">
                                        {trip.title} {trip.startDate ? `(${new Date(trip.startDate).toLocaleDateString()})` : ''}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">{t('itineraryBuilder.autoFillsFromDestinations')}</p>
                        </div>
                    )}

                    {/* Date Conflict Warning */}
                    {dateConflict && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-500 text-xl mt-0.5">warning</span>
                            <div>
                                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                                    {t('itineraryBuilder.dateConflictDetected')}
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-300 mt-1" dangerouslySetInnerHTML={{
                                    __html: t('itineraryBuilder.overlapsWith', {
                                        destination: dateConflict.destination,
                                        overlapDays: dateConflict.overlapDays,
                                        overlapStart: dateConflict.overlapStart,
                                        overlapEnd: dateConflict.overlapEnd
                                    })
                                }} />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('itineraryBuilder.destination')}
                        </label>
                        <input
                            type="text"
                            value={destination}
                            onChange={(e) => {
                                setDestination(e.target.value);
                                setErrors({ ...errors, destination: '' });
                            }}
                            placeholder={t('itineraryBuilder.destinationPlaceholder')}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.destination
                                ? 'border-red-500 focus:ring-red-400'
                                : 'border-gray-300 dark:border-white/20 focus:ring-amber-400'
                                } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent`}
                        />
                        {errors.destination && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-base">error</span>
                                {errors.destination}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                {t('itineraryBuilder.startDate')}
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => handleDateChange('start', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className={`w-full px-4 py-3 rounded-xl border ${errors.startDate
                                    ? 'border-red-500 focus:ring-red-400'
                                    : 'border-gray-300 dark:border-white/20 focus:ring-amber-400'
                                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent`}
                            />
                            {errors.startDate && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">error</span>
                                    {errors.startDate}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                {t('itineraryBuilder.endDate')}
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => handleDateChange('end', e.target.value)}
                                min={startDate || new Date().toISOString().split('T')[0]}
                                className={`w-full px-4 py-3 rounded-xl border ${errors.endDate
                                    ? 'border-red-500 focus:ring-red-400'
                                    : 'border-gray-300 dark:border-white/20 focus:ring-amber-400'
                                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent`}
                            />
                            {errors.endDate && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">error</span>
                                    {errors.endDate}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('itineraryBuilder.totalBudget', { currency: currencySymbol })}
                        </label>
                        <input
                            type="number"
                            value={totalBudget}
                            onChange={(e) => {
                                setTotalBudget(e.target.value);
                                setErrors({ ...errors, totalBudget: '' });
                            }}
                            placeholder="50000"
                            min="100"
                            className={`w-full px-4 py-3 rounded-xl border ${errors.totalBudget
                                ? 'border-red-500 focus:ring-red-400'
                                : 'border-gray-300 dark:border-white/20 focus:ring-amber-400'
                                } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent`}
                        />
                        {errors.totalBudget && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-base">error</span>
                                {errors.totalBudget}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isCreating}
                        className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isCreating ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                                {t('itineraryBuilder.creating')}
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">add</span>
                                {t('itineraryBuilder.createItineraryBtn')}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );

    // If no itineraries and no form shown, show creation form
    if (itineraries.length === 0 || showCreateForm) {
        return (
            <div className="space-y-6">
                {/* Show existing itinerary cards above the form if any */}
                {itineraries.length > 0 && renderItineraryCards()}
                {renderCreateForm()}
            </div>
        );
    }

    // Render itinerary list cards
    function renderItineraryCards() {
        // Filter itineraries by time (Upcoming vs Past)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filteredItineraries = itineraries.filter(itin => {
            if (!itin.endDate) return timeFilter === 'upcoming';
            const tripEndDate = new Date(itin.endDate);
            const isPast = tripEndDate < today;
            return timeFilter === 'upcoming' ? !isPast : isPast;
        });

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500">map</span>
                        {t('itineraryBuilder.yourItineraries', { count: itineraries.length })}
                    </h2>
                    <button
                        onClick={() => {
                            setShowCreateForm(true);
                            setDateConflict(null);
                        }}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-xl transition-colors flex items-center gap-2 text-sm"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        {t('itineraryBuilder.newItinerary')}
                    </button>
                </div>

                {/* Time Filter Tabs (Upcoming / Past) */}
                <div className="flex bg-gray-100 dark:bg-black/30 w-fit rounded-lg p-1 border border-gray-200 dark:border-white/10 mb-2">
                    <button
                        onClick={() => setTimeFilter('upcoming')}
                        className={`px-5 py-1.5 rounded-md text-sm font-bold transition-all ${timeFilter === 'upcoming' ? 'bg-white dark:bg-white/10 text-amber-500 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setTimeFilter('past')}
                        className={`px-5 py-1.5 rounded-md text-sm font-bold transition-all ${timeFilter === 'past' ? 'bg-white dark:bg-white/10 text-amber-500 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        Past
                    </button>
                </div>

                {filteredItineraries.length === 0 ? (
                    <div className="text-center py-12 bg-white/10 dark:bg-white/5 rounded-2xl border border-dashed border-gray-300 dark:border-white/10">
                        <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">event_busy</span>
                        <p className="text-gray-500 font-medium">No {timeFilter} itineraries found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItineraries.map((itin) => {
                            const isActive = activeItinerary?.id === itin.id;
                            const spent = calculateTotalCost(itin.days);
                            const remaining = itin.totalBudget - spent;
                            const budgetPct = Math.round((spent / itin.totalBudget) * 100);

                            return (
                                <div
                                    key={itin.id}
                                    onClick={() => setActiveItinerary(isActive ? null : itin)}
                                    className={`relative rounded-2xl p-5 cursor-pointer backdrop-blur-[2px] transition-all duration-200 border-2 ${isActive
                                        ? 'border-amber-400 bg-gradient-to-br from-amber-400/10 to-amber-400/5 dark:from-amber-400/20 dark:to-amber-400/5 shadow-lg shadow-amber-400/20 scale-[1.02]'
                                        : 'border-gray-200 dark:border-white/10 bg-gradient-to-br from-white/20 to-white/10 dark:from-white/[0.04] dark:to-transparent hover:border-amber-400/50 hover:shadow-md'
                                        }`}
                                >
                                    {/* Active indicator */}
                                    {isActive && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                                            <span className="material-symbols-outlined text-black text-sm">check</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            confirmDeleteItinerary(itin.id, itin.destination);
                                        }}
                                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-200/80 dark:bg-white/10 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors group"
                                        title="Delete itinerary"
                                    >
                                        <span className="material-symbols-outlined text-sm text-gray-500 group-hover:text-white">delete</span>
                                    </button>

                                    <div className="flex items-start gap-3 mb-3">
                                        <span className="text-2xl">✈️</span>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white truncate pr-8">{itin.destination}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(itin.startDate).toLocaleDateString()} → {new Date(itin.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Mini stats */}
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-gray-100 dark:bg-white/5 rounded-lg py-1.5 px-1">
                                            <div className="text-xs text-gray-500">{t('itineraryBuilder.days')}</div>
                                            <div className="font-bold text-gray-900 dark:text-white text-sm">{itin.days.length}</div>
                                        </div>
                                        <div className="bg-gray-100 dark:bg-white/5 rounded-lg py-1.5 px-1">
                                            <div className="font-bold text-gray-900 dark:text-white text-sm">{formatAmount(itin.totalBudget)}</div>
                                        </div>
                                        <div className="bg-gray-100 dark:bg-white/5 rounded-lg py-1.5 px-1">
                                            <div className="text-xs text-gray-500">{t('itineraryBuilder.used')}</div>
                                            <div className={`font-bold text-sm ${budgetPct > 80 ? 'text-red-500' : budgetPct > 50 ? 'text-amber-500' : 'text-green-500'}`}>
                                                {budgetPct}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Budget progress bar */}
                                    <div className="mt-2 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${budgetPct > 80 ? 'bg-red-500' : budgetPct > 50 ? 'bg-amber-400' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${Math.min(budgetPct, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // Main view: itinerary cards + active itinerary details
    return (
        <div className="space-y-6">
            {/* Itinerary Cards */}
            {renderItineraryCards()}

            {/* Active Itinerary Day-by-Day View */}
            {activeItinerary && (
                <div className="space-y-6">
                    {/* Header with stats */}
                    <div className="bg-gradient-to-br from-white/20 to-white/10 dark:from-white/[0.04] dark:to-transparent backdrop-blur-[2px] rounded-2xl p-6 border border-gray-200 dark:border-white/10 relative overflow-hidden group">
                        {/* Topographic pattern background (matching existing dashboard style) */}
                        <div className="absolute inset-0 opacity-5 dark:opacity-[0.02] pointer-events-none"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {activeItinerary.destination}
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        {new Date(activeItinerary.startDate).toLocaleDateString()} - {new Date(activeItinerary.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="text-4xl">✈️</span>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white/50 dark:bg-white/[0.05] rounded-xl p-4 border border-gray-200 dark:border-white/5">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('itineraryBuilder.totalDays')}</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDays}</div>
                                </div>

                                <div className="bg-white/50 dark:bg-white/[0.05] rounded-xl p-4 border border-gray-200 dark:border-white/5">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('itineraryBuilder.budget')}</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatAmount(activeItinerary.totalBudget)}</div>
                                </div>

                                <div className="bg-white/50 dark:bg-white/[0.05] rounded-xl p-4 border border-gray-200 dark:border-white/5">
                                    <div className={`text-2xl font-bold text-${stats.budgetStatus.color}-600 dark:text-${stats.budgetStatus.color}-400`}>
                                        {formatAmount(stats.totalSpent)}
                                    </div>
                                </div>

                                <div className="bg-white/50 dark:bg-white/[0.05] rounded-xl p-4 border border-gray-200 dark:border-white/5">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('itineraryBuilder.remaining')}</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatAmount(stats.budgetRemaining)}</div>
                                </div>
                            </div>

                            {/* AI Budget Recommendations */}
                            {budgetBreakdown && (
                                <div className="mt-4 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xl">🤖</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{t('itineraryBuilder.aiBudgetBreakdown')}</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">{t('itineraryBuilder.hotels')}</span>
                                            <span className="font-semibold text-gray-900 dark:text-white ml-2">
                                                {formatAmount(budgetBreakdown.accommodation)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">{t('itineraryBuilder.food')}</span>
                                            <span className="font-semibold text-gray-900 dark:text-white ml-2">
                                                {formatAmount(budgetBreakdown.food)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">{t('itineraryBuilder.activities')}</span>
                                            <span className="font-semibold text-gray-900 dark:text-white ml-2">
                                                {formatAmount(budgetBreakdown.activities)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">{t('itineraryBuilder.transport')}</span>
                                            <span className="font-semibold text-gray-900 dark:text-white ml-2">
                                                {formatAmount(budgetBreakdown.transportation)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div> {/* end of relative z-10 */}
                    </div>

                    {/* Day Cards */}
                    <div className="space-y-4">
                        {activeItinerary.days.map((day, index) => (
                            <DayCard
                                key={index}
                                day={day}
                                dayIndex={index}
                                itineraryId={activeItinerary.id}
                                dailyBudget={budgetBreakdown?.perDay || 0}
                                savedActivities={activeTrip?.savedActivities || []}
                                onUpdate={loadItineraries}
                            />
                        ))}
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, itineraryId: null, destName: '' })}
                onConfirm={handleDeleteItinerary}
                title={t('itineraryBuilder.deleteItineraryTitle')}
                message={t('itineraryBuilder.deleteItineraryMessage', { destination: deleteModal.destName })}
                confirmText={t('itineraryBuilder.delete')}
                cancelText={t('itineraryBuilder.cancel')}
                type="danger"
            />
        </div>
    );
};

export default ItineraryBuilder;
