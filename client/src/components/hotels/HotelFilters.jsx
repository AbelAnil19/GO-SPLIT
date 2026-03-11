import { useState } from 'react';

const HotelFilters = ({ filters, onChange, onApply }) => {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleChange = (key, value) => {
        const updated = { ...localFilters, [key]: value };
        setLocalFilters(updated);
        onChange(updated);
    };

    const handleToggleType = (type) => {
        const types = localFilters.types || [];
        const updated = types.includes(type)
            ? types.filter(t => t !== type)
            : [...types, type];
        handleChange('types', updated);
    };

    const handleToggleAmenity = (amenity) => {
        const amenities = localFilters.amenities || [];
        const updated = amenities.includes(amenity)
            ? amenities.filter(a => a !== amenity)
            : [...amenities, amenity];
        handleChange('amenities', updated);
    };

    const handleReset = () => {
        const reset = {
            minPrice: null,
            maxPrice: null,
            minStars: null,
            types: [],
            amenities: [],
            budget: filters.budget,
            groupSize: filters.groupSize,
            affordableOnly: false
        };
        setLocalFilters(reset);
        onChange(reset);
    };

    return (
        <div className="bg-white/20 dark:bg-white/[0.05] rounded-2xl border border-gray-200/40 dark:border-white/10 p-6 sticky top-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Filters</h3>
                <button
                    onClick={handleReset}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                >
                    Reset All
                </button>
            </div>

            <div className="space-y-6">
                {/* AI Toggle */}
                <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={localFilters.affordableOnly}
                            onChange={(e) => handleChange('affordableOnly', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-amber-400 focus:ring-amber-400"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            🤖 Show Affordable Only
                        </span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                        Filter hotels within your budget
                    </p>
                </div>

                {/* Price Range */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Price Range (per night)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="number"
                            placeholder="Min"
                            value={localFilters.minPrice || ''}
                            onChange={(e) => handleChange('minPrice', parseInt(e.target.value) || null)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        />
                        <input
                            type="number"
                            placeholder="Max"
                            value={localFilters.maxPrice || ''}
                            onChange={(e) => handleChange('maxPrice', parseInt(e.target.value) || null)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Star Rating */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Minimum Star Rating
                    </label>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => handleChange('minStars', localFilters.minStars === star ? null : star)}
                                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${localFilters.minStars === star
                                    ? 'bg-amber-400 text-black'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {star}★
                            </button>
                        ))}
                    </div>
                </div>

                {/* Property Type */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Property Type
                    </label>
                    <div className="space-y-2">
                        {['hotel', 'hostel', 'guest_house', 'motel'].map((type) => (
                            <label key={type} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localFilters.types?.includes(type) || false}
                                    onChange={() => handleToggleType(type)}
                                    className="w-4 h-4 rounded border-gray-300 text-amber-400 focus:ring-amber-400"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                    {type.replace('_', ' ')}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Amenities */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Amenities
                    </label>
                    <div className="space-y-2">
                        {['wifi', 'pool', 'restaurant', 'bar', 'breakfast', 'ac', 'parking'].map((amenity) => (
                            <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localFilters.amenities?.includes(amenity) || false}
                                    onChange={() => handleToggleAmenity(amenity)}
                                    className="w-4 h-4 rounded border-gray-300 text-amber-400 focus:ring-amber-400"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                    {amenity === 'wifi' ? 'WiFi' : amenity === 'ac' ? 'AC' : amenity}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Filter Status */}
                <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
                    <span className="material-symbols-outlined text-sm align-middle text-green-500">check_circle</span>
                    {' '}Filters apply instantly
                </div>
            </div>
        </div>
    );
};

export default HotelFilters;
