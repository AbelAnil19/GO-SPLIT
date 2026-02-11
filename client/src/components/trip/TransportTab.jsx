import React, { useState, useEffect } from 'react';
import { fetchNearbyPlaces, getPlaceIcon } from '../../services/overpassAPI';

const TransportTab = ({ trip }) => {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (trip && trip.lat && trip.lon) {
            loadNearbyTransport();
        }
    }, [trip]);

    const loadNearbyTransport = async () => {
        setLoading(true);
        setError(null);
        try {
            const results = await fetchNearbyPlaces(trip.lat, trip.lon, 'transport', 10000);
            setPlaces(results);
        } catch (err) {
            setError('Failed to load nearby transport. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!trip) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">directions_bus</span>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">No trip selected</p>
                <p className="text-gray-500 text-sm">Select a trip from the Destinations tab to plan transport</p>
            </div>
        );
    }

    if (!trip.lat || !trip.lon) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-6xl text-amber-400 mb-4">error</span>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">Location data missing</p>
                <p className="text-gray-500 text-sm">This trip doesn't have coordinates</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Finding nearby transport...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-6xl text-red-400 mb-4">error</span>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">{error}</p>
                <button
                    onClick={loadNearbyTransport}
                    className="mt-4 px-4 py-2 bg-amber-400 text-black rounded-lg hover:bg-amber-500 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nearby Transport</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Found {places.length} transport options within 10km of {trip.title}
                    </p>
                </div>
                <button
                    onClick={loadNearbyTransport}
                    className="px-4 py-2 bg-amber-400/10 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-400/20 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-base">refresh</span>
                    Refresh
                </button>
            </div>

            {/* Transport List */}
            {places.length === 0 ? (
                <div className="text-center py-16">
                    <span className="material-symbols-outlined text-5xl text-gray-400 mb-3">directions_bus_filled</span>
                    <p className="text-gray-600 dark:text-gray-400">No transport found nearby</p>
                    <p className="text-gray-500 text-sm">Try a different location</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {places.map(place => (
                        <div
                            key={place.id}
                            className="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10 hover:border-amber-400/50 hover:shadow-lg transition-all"
                        >
                            {/* Icon & Type */}
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
                                    href={`https://www.google.com/maps/dir/?api=1&origin=${trip.lat},${trip.lon}&destination=${place.lat},${place.lon}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 px-3 py-2 bg-amber-400 text-black text-xs font-semibold rounded-lg hover:bg-amber-500 transition-colors flex items-center justify-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">directions</span>
                                    Directions
                                </a>
                                <a
                                    href={`https://www.google.com/maps?q=${place.lat},${place.lon}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors flex items-center justify-center"
                                    title="View on map"
                                >
                                    <span className="material-symbols-outlined text-sm">map</span>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TransportTab;
