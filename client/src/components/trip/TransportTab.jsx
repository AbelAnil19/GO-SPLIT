import React, { useState, useEffect } from 'react';
import { fetchNearbyPlacesGeoapify } from '../../services/geoapifyService';
import { useCurrency } from '../../context/CurrencyContext';

// Price estimates per km for each mode (in INR)
const TRANSPORT_MODES = [
    {
        id: 'bus',
        label: 'Bus',
        icon: 'directions_bus',
        color: 'blue',
        pricePerKm: 2,
        basePrice: 10,
        description: 'Local & express bus routes',
        pros: ['Most affordable', 'Wide coverage', 'Fixed routes'],
        bookingLink: 'https://www.redbus.in',
        bookingLabel: 'Book on RedBus',
        emoji: '🚌'
    },
    {
        id: 'auto',
        label: 'Auto Rickshaw',
        icon: 'electric_rickshaw',
        color: 'green',
        pricePerKm: 12,
        basePrice: 25,
        description: 'Three-wheel auto rickshaws',
        pros: ['No traffic jams', 'City-wide availability', 'Negotiate fare'],
        bookingLink: null,
        bookingLabel: 'Hail on street',
        emoji: '🛺'
    },
    {
        id: 'taxi',
        label: 'Taxi / Cab',
        icon: 'local_taxi',
        color: 'amber',
        pricePerKm: 18,
        basePrice: 50,
        description: 'Metered taxis & app cabs',
        pros: ['AC comfort', 'Door-to-door', 'Safe & metered'],
        bookingLink: 'https://www.olacabs.com',
        bookingLabel: 'Book on Ola',
        emoji: '🚕'
    },
    {
        id: 'cab',
        label: 'Ride Share',
        icon: 'directions_car',
        color: 'purple',
        pricePerKm: 14,
        basePrice: 40,
        description: 'Uber, Ola & ride-share apps',
        pros: ['App tracking', 'Cashless payment', 'Surge pricing during peak'],
        bookingLink: 'https://www.uber.com',
        bookingLabel: 'Book on Uber',
        emoji: '🚗'
    }
];

const getColorClasses = (color) => {
    const map = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400',
        green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400',
        amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400',
        purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400',
    };
    return map[color] || map.blue;
};

const getBadgeClasses = (color) => {
    const map = {
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
        amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    };
    return map[color] || map.blue;
};

const TransportTab = ({ trip }) => {
    const { formatAmount } = useCurrency();
    const [nearbyStops, setNearbyStops] = useState([]);
    const [loadingStops, setLoadingStops] = useState(false);
    const [distanceKm, setDistanceKm] = useState(5); // default estimate
    const [selectedMode, setSelectedMode] = useState(null);

    useEffect(() => {
        if (trip?.lat && trip?.lon) {
            loadNearbyTransport();
        }
    }, [trip]);

    const loadNearbyTransport = async () => {
        setLoadingStops(true);
        try {
            const results = await fetchNearbyPlacesGeoapify(trip.lat, trip.lon, 'transport', 10000);
            setNearbyStops(results);
        } catch {
            setNearbyStops([]);
        } finally {
            setLoadingStops(false);
        }
    };

    const estimatePrice = (mode) => {
        const km = Math.max(1, distanceKm);
        return Math.round(mode.basePrice + mode.pricePerKm * km);
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transport Discovery</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        Bus, Auto, Taxi & Cab options for <span className="font-semibold text-amber-500">{trip.title}</span>
                    </p>
                </div>
                <span className="text-4xl">🗺️</span>
            </div>

            {/* Distance Estimator */}
            <div className="bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] backdrop-blur-[2px] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-none">
                <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-amber-500">route</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Estimate Your Journey Distance</h3>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(Number(e.target.value))}
                        className="flex-1 accent-amber-400"
                    />
                    <span className="text-2xl font-black text-amber-500 w-20 text-right">{distanceKm} km</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Slide to adjust distance — fare estimates update automatically</p>
            </div>

            {/* Transport Mode Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TRANSPORT_MODES.map((mode) => {
                    const price = estimatePrice(mode);
                    const isSelected = selectedMode === mode.id;

                    return (
                        <div
                            key={mode.id}
                            onClick={() => setSelectedMode(isSelected ? null : mode.id)}
                            className={`rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 ${isSelected
                                ? getColorClasses(mode.color) + ' scale-[1.02] shadow-lg backdrop-blur-[2px]'
                                : 'bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] backdrop-blur-[2px] border-gray-200 dark:border-white/10 hover:border-amber-400/50 hover:shadow-xl shadow-md dark:shadow-none'
                                }`}
                        >
                            {/* Mode Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isSelected ? 'bg-white/30' : 'bg-gray-100 dark:bg-white/10'
                                        }`}>
                                        {mode.emoji}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{mode.label}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{mode.description}</p>
                                    </div>
                                </div>

                                {/* Price badge */}
                                <div className={`text-right px-3 py-2 rounded-xl ${getBadgeClasses(mode.color)}`}>
                                    <div className="text-xs font-medium opacity-75">~Fare</div>
                                    <div className="font-black text-lg">{formatAmount(price, 'INR')}</div>
                                </div>
                            </div>

                            {/* Price breakdown */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                Base {formatAmount(mode.basePrice, 'INR')} + {formatAmount(mode.pricePerKm, 'INR')}/km × {distanceKm}km
                            </div>

                            {/* Pros */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {mode.pros.map((pro, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                                    >
                                        ✓ {pro}
                                    </span>
                                ))}
                            </div>

                            {/* Book CTA */}
                            {mode.bookingLink ? (
                                <a
                                    href={mode.bookingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-xl text-sm transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                                    {mode.bookingLabel}
                                </a>
                            ) : (
                                <div className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-xl text-sm">
                                    <span className="material-symbols-outlined text-sm">hail</span>
                                    {mode.bookingLabel}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Budget Comparison Summary */}
            <div className="bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] backdrop-blur-[2px] border-2 border-gray-200 dark:border-white/10 shadow-md dark:shadow-none rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">📊</span>
                    <h3 className="font-bold text-gray-900 dark:text-white">Price Comparison for {distanceKm}km</h3>
                </div>
                <div className="grid grid-cols-4 gap-3">
                    {TRANSPORT_MODES.map(mode => (
                        <div key={mode.id} className="text-center">
                            <div className="text-2xl mb-1">{mode.emoji}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{mode.label}</div>
                            <div className="font-bold text-gray-900 dark:text-white">{formatAmount(estimatePrice(mode), 'INR')}</div>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                    * Prices are estimates. Actual fares may vary based on traffic, time, and city.
                </p>
            </div>

            {/* Nearby Transport Hubs */}
            {(nearbyStops.length > 0 || loadingStops) && (
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500">location_on</span>
                        Nearby Transport Hubs
                    </h3>
                    {loadingStops ? (
                        <div className="flex items-center gap-3 text-gray-500">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-400" />
                            Finding nearby stations...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {nearbyStops.slice(0, 6).map(stop => (
                                <a
                                    key={stop.id}
                                    href={`https://www.google.com/maps?q=${stop.lat},${stop.lon}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] backdrop-blur-[2px] border border-gray-200 dark:border-white/10 rounded-xl hover:border-amber-400/50 hover:shadow-md transition-all group shadow-sm dark:shadow-none"
                                >
                                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                                        <img
                                            src={stop.image}
                                            alt={stop.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=200';
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{stop.name}</p>
                                        <p className="text-xs text-gray-500">{stop.distance} km away</p>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400 text-base">open_in_new</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TransportTab;
