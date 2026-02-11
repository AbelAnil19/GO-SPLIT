import React, { useState, useEffect } from 'react';
import { fetchNearbyPlaces, getPlaceIcon } from '../../services/overpassAPI';

const ActivitiesTab = ({ trip }) => {
    const [places, setPlaces] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const categories = [
        { id: 'all', label: 'All', icon: 'grid_view' },
        { id: 'restaurants', label: 'Food', icon: 'restaurant' },
        { id: 'attractions', label: 'Attractions', icon: 'attractions' }
    ];

    useEffect(() => {
        if (trip && trip.lat && trip.lon) {
            loadNearbyActivities();
        }
    }, [trip, activeCategory]);

    const loadNearbyActivities = async () => {
        setLoading(true);
        setError(null);
        try {
            const category = activeCategory === 'all' ? 'restaurants' : activeCategory;
            const results = await fetchNearbyPlaces(trip.lat, trip.lon, category, 10000);

            // If "all", fetch both restaurants and attractions
            if (activeCategory === 'all') {
                const attractions = await fetchNearbyPlaces(trip.lat, trip.lon, 'attractions', 10000);
                const combined = [...results, ...attractions].sort((a, b) => a.distance - b.distance);
                setPlaces(combined.slice(0, 50));
            } else {
                setPlaces(results);
            }
        } catch (err) {
            setError('Failed to load activities. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!trip) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">local_activity</span>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">No trip selected</p>
                <p className="text-gray-500 text-sm">Select a trip from the Destinations tab to explore activities</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Finding nearby activities...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nearby Activities</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Found {places.length} activities within 10km of {trip.title}
                    </p>
                </div>

                {/* Category Filters */}
                <div className="flex gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeCategory === cat.id
                                    ? 'bg-amber-400 text-black'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                                }`}
                        >
                            <span className="material-symbols-outlined text-base">{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Activities Grid */}
            {places.length === 0 ? (
                <div className="text-center py-16">
                    <span className="material-symbols-outlined text-5xl text-gray-400 mb-3">explore</span>
                    <p className="text-gray-600 dark:text-gray-400">No activities found nearby</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {places.map(place => (
                        <div
                            key={place.id}
                            className="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10 hover:border-amber-400/50 hover:shadow-lg transition-all"
                        >
                            {/* Icon & Name */}
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-12 h-12 rounded-full bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-amber-500 text-xl">
                                        {getPlaceIcon(place.type)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                        {place.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                        {place.type.replace('_', ' ')}
                                        {place.cuisine && ` • ${place.cuisine}`}
                                    </p>
                                </div>
                            </div>

                            {/* Distance */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-gray-400 text-sm">distance</span>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {place.distance} km away
                                </span>
                            </div>

                            {/* Address */}
                            {place.address && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                    {place.address}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                                <a
                                    href={`https://www.google.com/maps?q=${place.lat},${place.lon}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 px-3 py-2 bg-amber-400 text-black text-xs font-semibold rounded-lg hover:bg-amber-500 transition-colors flex items-center justify-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">map</span>
                                    View on Map
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActivitiesTab;
