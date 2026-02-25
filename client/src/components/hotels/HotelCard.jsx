import { useState } from 'react';
import { getAffordabilityBadge, getBookingLink } from '../../services/hotelService';
import { useCurrency } from '../../context/CurrencyContext';

const HotelCard = ({ hotel, budget, groupSize }) => {
    const { formatAmount } = useCurrency();
    const [showDetails, setShowDetails] = useState(false);

    const affordabilityBadge = hotel.affordabilityScore
        ? getAffordabilityBadge(hotel.affordabilityScore)
        : null;

    const bookingLink = getBookingLink(hotel,
        new Date().toISOString().split('T')[0], // Today
        new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        groupSize || 1
    );

    return (
        <div className="bg-white/20 dark:bg-white/[0.05] rounded-2xl border border-gray-200/40 dark:border-white/10 overflow-hidden hover:shadow-lg transition-all flex flex-col">
            {/* Image */}
            <div className="h-48 w-full relative overflow-hidden group">
                <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                <div className="absolute bottom-3 left-4 text-white font-medium text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                    <span>{hotel.rawTags?.image ? 'From OpenStreetMap' : 'Representative Image'}</span>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {hotel.name}
                            </h3>
                            {affordabilityBadge && (
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border ${affordabilityBadge.bgClass} ${affordabilityBadge.textClass} ${affordabilityBadge.borderClass}`}>
                                    <span>{affordabilityBadge.icon}</span>
                                    {affordabilityBadge.label}
                                </span>
                            )}
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <span
                                        key={i}
                                        className={`material-symbols-outlined text-sm ${i < hotel.stars
                                            ? 'text-amber-400'
                                            : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                    >
                                        star
                                    </span>
                                ))}
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                {hotel.type}
                            </span>
                        </div>
                    </div>

                    {/* AI Score */}
                    {hotel.affordabilityScore && (
                        <div className="text-center">
                            <div className="text-3xl font-black text-gray-900 dark:text-white">
                                {hotel.affordabilityScore}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                AI Score
                            </div>
                        </div>
                    )}
                </div>

                {/* Location */}
                {hotel.location.address && (
                    <div className="flex items-start gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="material-symbols-outlined text-base mt-0.5">location_on</span>
                        <span>{hotel.location.address}</span>
                    </div>
                )}

                {/* Amenities */}
                {hotel.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {hotel.amenities.slice(0, 5).map((amenity, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-700 dark:text-gray-300 capitalize"
                            >
                                {amenity}
                            </span>
                        ))}
                        {hotel.amenities.length > 5 && (
                            <span className="px-2 py-1 text-xs text-gray-500">
                                +{hotel.amenities.length - 5} more
                            </span>
                        )}
                    </div>
                )}

                {/* Pricing */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Per Night</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatAmount(hotel.pricePerNight)}
                            </div>
                        </div>

                        {groupSize > 1 && (
                            <>
                                <div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Per Person</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                        {formatAmount(hotel.pricePerPerson)}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Rooms Needed</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                        {hotel.roomsNeeded}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Group Total</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                        {formatAmount(hotel.totalPrice)}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {hotel.estimatedPrice && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                            💡 AI estimated price - actual prices may vary
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">
                            {showDetails ? 'expand_less' : 'expand_more'}
                        </span>
                        {showDetails ? 'Hide' : 'Show'} Details
                    </button>

                    <a
                        href={bookingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">travel_explore</span>
                        Book Now
                    </a>
                </div>

                {/* Details Panel */}
                {showDetails && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        {/* Contact */}
                        {(hotel.contact.phone || hotel.contact.website || hotel.contact.email) && (
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Contact</h4>
                                <div className="space-y-1 text-sm">
                                    {hotel.contact.phone && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <span className="material-symbols-outlined text-base">call</span>
                                            {hotel.contact.phone}
                                        </div>
                                    )}
                                    {hotel.contact.email && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <span className="material-symbols-outlined text-base">email</span>
                                            {hotel.contact.email}
                                        </div>
                                    )}
                                    {hotel.contact.website && (
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base text-gray-600 dark:text-gray-400">language</span>
                                            <a
                                                href={hotel.contact.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-amber-600 dark:text-amber-400 hover:underline"
                                            >
                                                Visit Website
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* All Amenities */}
                        {hotel.amenities.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">All Amenities</h4>
                                <div className="flex flex-wrap gap-2">
                                    {hotel.amenities.map((amenity, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-700 dark:text-gray-300 capitalize"
                                        >
                                            {amenity}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Map Link */}
                        <div>
                            <a
                                href={`https://www.openstreetmap.org/?mlat=${hotel.location.lat}&mlon=${hotel.location.lon}#map=16/${hotel.location.lat}/${hotel.location.lon}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:underline"
                            >
                                <span className="material-symbols-outlined text-base">map</span>
                                View on Map
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HotelCard;
