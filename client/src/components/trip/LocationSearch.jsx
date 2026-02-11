import React, { useState, useEffect, useRef } from 'react';

const LocationSearch = ({ onLocationSelect, placeholder = "Search for a city..." }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 3) {
                searchLocation(query);
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchLocation = async (searchQuery) => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`
            );
            const data = await response.json();
            setResults(data);
            setShowDropdown(true);
        } catch (error) {
            console.error("Error searching location:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWikiImage = async (title) => {
        try {
            // Using Wikimedia Commons API
            const response = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(title)}&origin=*`
            );
            const data = await response.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];

            if (pages[pageId].original) {
                return pages[pageId].original.source;
            }
            return null;
        } catch (error) {
            console.error("Error fetching image:", error);
            return null;
        }
    };

    const handleSelect = async (location) => {
        setQuery(location.display_name.split(',')[0]); // Set input to city name
        setShowDropdown(false);
        setLoading(true);

        // Try to get a nice image
        let imageUrl = null;
        const city = location.address?.city || location.address?.town || location.address?.village || location.name;

        if (city) {
            imageUrl = await fetchWikiImage(city);
        }

        // Fallback image if wiki fails
        if (!imageUrl) {
            imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(city || 'travel')}`;
        }

        const locationData = {
            id: location.place_id,
            title: city || location.name,
            location: location.display_name,
            lat: location.lat,
            lon: location.lon,
            image: imageUrl,
            estimatedCost: 0, // Will be set in modal
            duration: 'Custom',
            category: 'Custom',
            tags: ['Custom Trip'],
            isFavorite: false,
            rating: 4.5,
            reviews: 0,
            price: '$$',
            description: `Trip to ${city || location.name}`
        };

        onLocationSelect(locationData);
        setLoading(false);
        setQuery(''); // Reset search after selection (optional, or keep it)
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    travel_explore
                </span>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowDropdown(true);
                    }}
                    placeholder={placeholder}
                    className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50 transition-colors"
                />
                {loading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-400"></div>
                    </div>
                )}
            </div>

            {/* Dropdown Results */}
            {showDropdown && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-[100] max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    {results.map((item) => (
                        <button
                            key={item.place_id}
                            onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input blur
                                handleSelect(item);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0"
                        >
                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                {item.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {item.display_name}
                            </p>
                        </button>
                    ))}
                    <div className="px-4 py-2 bg-gray-50 dark:bg-white/5 text-[10px] text-gray-400 text-center uppercase tracking-wider">
                        Powered by OpenStreetMap
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationSearch;
