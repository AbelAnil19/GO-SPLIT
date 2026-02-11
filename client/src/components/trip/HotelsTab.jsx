import React, { useState, useEffect } from 'react';
import { fetchNearbyPlaces, getPlaceIcon } from '../../services/overpassAPI';

const HotelsTab = ({ trip }) => {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (trip && trip.lat && trip.lon) {
            loadNearbyHotels();
        }
    }, [trip]);

    const loadNearbyHotels = async () => {
        setLoading(true);
        setError(null);
        try {
            const results = await fetchNearbyPlaces(trip.lat, trip.lon, 'hotels', 10000);
            setPlaces(results);
        } catch (err) {
            setError('Failed to load nearby hotels. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!trip) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">hotel</span>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">No trip selected</p>
                <p className="text-gray-500 text-sm">Select a trip from the Destinations tab to find hotels</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Finding nearby hotels...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nearby Hotels</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Found {places.length} accommodations within 10km of {trip.title}
                    </p>
                </div>
                <button
                    onClick={loadNearbyHotels}
                    className="px-4 py-2 bg-amber-400/10 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-400/20 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-base">refresh</span>
                    Refresh
                </button>
            </div>

            {/* Hotels Grid */}
            {places.length === 0 ? (
                <div className="text-center py-16">
                    <span className="material-symbols-outlined text-5xl text-gray-400 mb-3">hotel</span>
                    <p className="text-gray-600 dark:text-gray-400">No hotels found nearby</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {places.map(place => (
                        <div
                            key={place.id}
                            className="bg-white dark:bg-white/5 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 hover:border-amber-400/50 hover:shadow-lg transition-all"
                        >
                            {/* Header with Icon */}
                            <div className="h-32 bg-gradient-to-br from-amber-400/20 to-amber-600/10 flex items-center justify-center relative">
                                <span className="material-symbols-outlined text-6xl text-amber-500">
                                    {getPlaceIcon(place.type)}
                                </span>
                                {place.stars && (
                                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-xs text-white flex items-center gap-1">
                                        <span className="material-symbols-outlined text-yellow-400" style={{ fontSize: '14px' }}>star</span>
                                        {place.stars}
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                {/* Name & Type */}
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 truncate">
                                    {place.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mb-3">
                                    {place.type.replace('_', ' ')} • {place.distance} km
                                </p>

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
                                        View
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HotelsTab;
