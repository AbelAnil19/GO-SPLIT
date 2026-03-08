import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchNearbyPlaces, getPlaceIcon } from '../../services/overpassAPI';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';

const CATEGORIES = [
    { id: 'all', label: 'All', icon: 'grid_view', overpassKey: null, emoji: '🌍' },
    { id: 'food', label: 'Food & Cafes', icon: 'restaurant', overpassKey: 'restaurants', emoji: '🍽️' },
    { id: 'attractions', label: 'Attractions', icon: 'attractions', overpassKey: 'attractions', emoji: '🏛️' },
    { id: 'parks', label: 'Parks', icon: 'park', overpassKey: 'parks', emoji: '🌳' },
    { id: 'shopping', label: 'Shopping', icon: 'shopping_bag', overpassKey: 'shopping', emoji: '🛍️' },
];

// Estimated cost ranges by place type (in INR)
const PRICE_ESTIMATE = {
    restaurant: { min: 200, max: 800, suffix: '/person' },
    cafe: { min: 100, max: 400, suffix: '/person' },
    fast_food: { min: 80, max: 300, suffix: '/person' },
    museum: { min: 50, max: 500, suffix: ' entry' },
    attraction: { min: 0, max: 300, suffix: ' entry' },
    historic: { min: 0, max: 200, suffix: ' entry' },
    park: { min: 0, max: 100, suffix: ' entry' },
    garden: { min: 0, max: 100, suffix: ' entry' },
    shopping: { min: 500, max: 5000, suffix: '+ shopping' },
    mall: { min: 500, max: 5000, suffix: '+ shopping' },
    default: { min: 0, max: 500, suffix: '' }
};

const getPriceEstimate = (type) => {
    return PRICE_ESTIMATE[type] || PRICE_ESTIMATE.default;
};

const getPriceBadgeClass = (type) => {
    if (['restaurant', 'cafe', 'fast_food'].includes(type)) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
    if (['museum', 'attraction', 'historic'].includes(type)) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    if (['park', 'garden'].includes(type)) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    if (['shopping', 'mall'].includes(type)) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
    return 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400';
};

const getDurationEstimate = (type) => {
    if (['restaurant', 'cafe'].includes(type)) return '1–2 hrs';
    if (['museum'].includes(type)) return '2–3 hrs';
    if (['attraction', 'historic'].includes(type)) return '1–2 hrs';
    if (['park', 'garden'].includes(type)) return '1–3 hrs';
    if (['shopping', 'mall'].includes(type)) return '2–4 hrs';
    return '1–2 hrs';
};

const ACTIVITIES_PER_PAGE = 6;

const ActivitiesTab = ({ trip, onUpdateTrip }) => {
    const { t } = useTranslation();
    const { formatAmount } = useCurrency();
    const { addToast } = useToast();
    const [places, setPlaces] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showSavedModal, setShowSavedModal] = useState(false);

    // Read saved activities from trip or default to empty array
    const savedActivities = trip?.savedActivities || [];
    const savedActivityIds = savedActivities.map(a => a.id);

    useEffect(() => {
        if (trip?.lat && trip?.lon) {
            setCurrentPage(1); // Reset page on category/trip change
            loadActivities();
        }
    }, [trip, activeCategory]);

    const loadActivities = async () => {
        setLoading(true);
        try {
            const cat = CATEGORIES.find(c => c.id === activeCategory);

            if (activeCategory === 'all') {
                // Fetch restaurants and attractions sequentially to avoid 429 Rate Limits
                const food = await fetchNearbyPlaces(trip.lat, trip.lon, 'restaurants', 10000);
                const attr = await fetchNearbyPlaces(trip.lat, trip.lon, 'attractions', 10000);

                const combined = [...food, ...attr].sort((a, b) => a.distance - b.distance).slice(0, 40);
                setPlaces(combined);
            } else {
                const results = await fetchNearbyPlaces(trip.lat, trip.lon, cat.overpassKey, 10000);
                setPlaces(results);
            }
        } catch {
            setPlaces([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleSave = (place) => {
        const isSaved = savedActivityIds.includes(place.id);

        let newSaved;
        if (isSaved) {
            newSaved = savedActivities.filter(a => a.id !== place.id);
        } else {
            const estimate = getPriceEstimate(place.type);
            const durationStr = getDurationEstimate(place.type);
            const durNum = parseInt(durationStr.split('–')[0]) || 2;

            newSaved = [...savedActivities, {
                id: place.id || Date.now().toString(),
                title: place.name || 'Unnamed Activity',
                location: place.address || place.name || 'Unknown Location',
                cost: estimate?.min || 0,
                duration: durNum || 2,
                category: place.type || 'activity',
                source: 'overpass'
            }];
        }

        if (onUpdateTrip) {
            onUpdateTrip({ savedActivities: newSaved });
        }
    };

    if (!trip) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">local_activity</span>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">{t('activitiesTab.noTripTitle')}</p>
                <p className="text-gray-500 text-sm">{t('activitiesTab.noTripDesc')}</p>
            </div>
        );
    }

    const totalPages = Math.ceil(places.length / ACTIVITIES_PER_PAGE);
    const startIndex = (currentPage - 1) * ACTIVITIES_PER_PAGE;
    const currentPlaces = places.slice(startIndex, startIndex + ACTIVITIES_PER_PAGE);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('activitiesTab.title')}</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {t('activitiesTab.subtitle', { title: trip.title })}
                    </p>
                </div>
                {savedActivities.length > 0 && (
                    <button
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 text-white dark:text-gray-900 border border-transparent rounded-xl px-4 py-2.5 shadow-md shadow-amber-500/20 transition-all font-semibold"
                        onClick={() => {
                            setShowSavedModal(true);
                        }}
                    >
                        <span className="material-symbols-outlined text-base">bookmark</span>
                        <span>{t('activitiesTab.savedCount', { count: savedActivities.length })}</span>
                    </button>
                )}
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeCategory === cat.id
                            ? 'bg-amber-400 text-black shadow-md'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
                            }`}
                    >
                        <span>{cat.emoji}</span>
                        {t(`activitiesTab.categories.${cat.id}`)}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mb-4" />
                    <p className="text-gray-500">{t('activitiesTab.findingActivities')}</p>
                </div>
            )}

            {/* Results */}
            {!loading && (
                <>
                    {places.length === 0 ? (
                        <div className="text-center py-16">
                            <span className="text-5xl mb-4 block">🔍</span>
                            <p className="text-gray-600 dark:text-gray-400 font-semibold">{t('activitiesTab.noActivitiesFound')}</p>
                            <p className="text-gray-500 text-sm mt-1">{t('activitiesTab.tryDifferentCategory')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Results count */}
                            <p className="text-sm text-gray-500">
                                {t('activitiesTab.showingActivities', { count: places.length })}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {currentPlaces.map(place => {
                                    const price = getPriceEstimate(place.type);
                                    const isSaved = savedActivityIds.includes(place.id);

                                    return (
                                        <div
                                            key={place.id}
                                            className={`bg-gradient-to-br from-white/20 to-white/10 dark:from-white/[0.04] dark:to-transparent backdrop-blur-[2px] rounded-2xl border-2 transition-all hover:shadow-lg relative overflow-hidden group ${isSaved
                                                ? 'border-amber-400 shadow-md shadow-amber-400/20'
                                                : 'border-gray-200 dark:border-white/10 hover:border-amber-400/50'
                                                }`}
                                        >
                                            {/* Topographic pattern background */}
                                            <div className="absolute inset-0 opacity-5 dark:opacity-[0.02] pointer-events-none"
                                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                                            </div>

                                            <div className="relative z-10 flex flex-col h-full">
                                                {/* Image */}
                                                <div className="h-40 w-full relative overflow-hidden group">
                                                    <img
                                                        src={place.image}
                                                        alt={place.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&q=80&w=400';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                                    <div className="absolute bottom-2 left-3 text-white font-medium text-xs flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-xs">photo_camera</span>
                                                        <span>{place.website ? t('activitiesTab.officialPhoto') : t('activitiesTab.representativeImage')}</span>
                                                    </div>
                                                </div>

                                                <div className="p-4 flex-1 flex flex-col">
                                                    {/* Title row */}
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight truncate">
                                                                {place.name}
                                                            </h3>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">
                                                                {place.type?.replace(/_/g, ' ')}
                                                                {place.cuisine && ` • ${place.cuisine}`}
                                                            </p>
                                                        </div>
                                                        {/* Save button */}
                                                        <button
                                                            onClick={() => toggleSave(place)}
                                                            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${isSaved
                                                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-400/10'
                                                                : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-400/10'
                                                                }`}
                                                            title={isSaved ? t('activitiesTab.removeFromList') : t('activitiesTab.saveActivity')}
                                                        >
                                                            <span className="material-symbols-outlined text-lg">
                                                                {isSaved ? 'bookmark' : 'bookmark_border'}
                                                            </span>
                                                        </button>
                                                    </div>

                                                    {/* Tags row */}
                                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                                        {/* Distance */}
                                                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                                                            <span className="material-symbols-outlined text-xs">near_me</span>
                                                            {place.distance} {t('activitiesTab.km')}
                                                        </span>
                                                        {/* Duration */}
                                                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                                                            <span className="material-symbols-outlined text-xs">schedule</span>
                                                            {(() => {
                                                                const durationStr = getDurationEstimate(place.type);
                                                                if (durationStr === '1–2 hrs') return t('activitiesTab.duration.1to2');
                                                                if (durationStr === '2–3 hrs') return t('activitiesTab.duration.2to3');
                                                                if (durationStr === '1–3 hrs') return t('activitiesTab.duration.1to3');
                                                                if (durationStr === '2–4 hrs') return t('activitiesTab.duration.2to4');
                                                                return durationStr;
                                                            })()}
                                                        </span>
                                                        {/* Price estimate */}
                                                        <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getPriceBadgeClass(place.type)}`}>
                                                            <span className="material-symbols-outlined text-xs">payments</span>
                                                            {(() => {
                                                                const range = PRICE_ESTIMATE[place.type] || PRICE_ESTIMATE.default;
                                                                let suffixKey = range.suffix.replace('/', '').replace('+', '').trim();
                                                                if (suffixKey === '') suffixKey = 'none';

                                                                const suffixLabel = t(`activitiesTab.priceSuffix.${suffixKey}`);
                                                                if (range.min === 0) return `${t('activitiesTab.free')}–${formatAmount(range.max)}${suffixLabel}`;
                                                                return `${formatAmount(range.min)}–${formatAmount(range.max)}${suffixLabel}`;
                                                            })()}
                                                        </span>
                                                    </div>

                                                    {/* Address */}
                                                    {place.address && place.address !== 'Address not available' && (
                                                        <p className="text-xs text-gray-500 mb-3 line-clamp-1">{place.address}</p>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="flex gap-2 mt-auto">
                                                        <a
                                                            href={`https://www.google.com/maps?q=${place.lat},${place.lon}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 py-2 bg-amber-400 hover:bg-amber-500 text-black text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">map</span>
                                                            {t('activitiesTab.directions')}
                                                        </a>
                                                        <button
                                                            onClick={() => toggleSave(place)}
                                                            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${isSaved
                                                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-400/10'
                                                                : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-400/10'
                                                                }`}
                                                            title={isSaved ? t('activitiesTab.removeFromList') : t('activitiesTab.saveActivity')}
                                                        >
                                                            <span className="material-symbols-outlined text-lg">
                                                                {isSaved ? 'bookmark' : 'bookmark_border'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-4 mt-8">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-xl bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 hover:border-amber-400 dark:hover:border-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center text-gray-700 dark:text-gray-300"
                                    >
                                        <span className="material-symbols-outlined">chevron_left</span>
                                    </button>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-lg">
                                        {t('activitiesTab.pageOf', { current: currentPage, total: totalPages })}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-xl bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 hover:border-amber-400 dark:hover:border-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center text-gray-700 dark:text-gray-300"
                                    >
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Budget Tip */}
            {!loading && places.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-400/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">💡</span>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{t('activitiesTab.budgetTipTitle')}</p>
                            <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                                {t('activitiesTab.budgetTipDesc')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Saved Places Modal */}
            {showSavedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowSavedModal(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative w-full max-w-lg bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">bookmark</span>
                                {t('activitiesTab.savedPlaces')}
                            </h3>
                            <button
                                onClick={() => setShowSavedModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto overflow-x-hidden flex-1 space-y-3">
                            {savedActivities.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">{t('activitiesTab.noSavedPlaces')}</div>
                            ) : (
                                savedActivities.map(place => (
                                    <div key={place.id} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-start justify-between group">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{place.title}</h4>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{place.location}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleSave({ id: place.id })}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 flex-shrink-0"
                                            title={t('activitiesTab.remove')}
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                            <button
                                onClick={() => setShowSavedModal(false)}
                                className="px-4 py-2 font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                {t('activitiesTab.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivitiesTab;
