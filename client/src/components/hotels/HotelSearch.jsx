import { useState, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import { searchHotelsByCity, applyFilters } from '../../services/hotelService';
import HotelCard from './HotelCard';
import HotelFilters from './HotelFilters';
import { useCurrency } from '../../context/CurrencyContext';

const HOTELS_PER_PAGE = 5;

const HotelSearch = ({ destination, groupSize, budget }) => {
    const { addToast } = useToast();
    const { formatAmount } = useCurrency();
    const [allHotels, setAllHotels] = useState([]); // Raw unfiltered results from API
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState(destination || '');
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        minPrice: null,
        maxPrice: null,
        minStars: null,
        types: [],
        amenities: [],
        budget: budget || null,
        groupSize: groupSize || 1,
        affordableOnly: false
    });

    const handleSearch = async (e) => {
        e?.preventDefault();

        if (!searchQuery.trim()) {
            addToast('Please enter a city name', 'error');
            return;
        }

        setLoading(true);

        // Fetch ALL hotels without filters — we'll filter client-side
        const result = await searchHotelsByCity(searchQuery, {
            budget: budget || filters.budget,
            groupSize: groupSize || filters.groupSize
        });

        setLoading(false);

        if (result.success) {
            setAllHotels(result.data);
            if (result.data.length === 0) {
                addToast('No hotels found in this area. Try a different city.', 'info');
            } else {
                addToast(`Found ${result.data.length} hotels`, 'success');
            }
        } else {
            addToast(result.error || 'Failed to search hotels', 'error');
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters({ ...filters, ...newFilters });
        setCurrentPage(1); // Reset to first page when filters change
    };

    // Client-side filtering — instant, no API roundtrip
    const hotels = useMemo(() => {
        if (allHotels.length === 0) return [];
        return applyFilters(allHotels, {
            ...filters,
            budget: budget || filters.budget,
            groupSize: groupSize || filters.groupSize
        }).sort((a, b) => (b.affordabilityScore || 0) - (a.affordabilityScore || 0));
    }, [allHotels, filters, budget, groupSize]);

    // Pagination calculation
    const totalPages = Math.ceil(hotels.length / HOTELS_PER_PAGE);
    const startIndex = (currentPage - 1) * HOTELS_PER_PAGE;
    const endIndex = startIndex + HOTELS_PER_PAGE;
    const currentHotels = hotels.slice(startIndex, endIndex);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-white/20 dark:bg-white/[0.05] rounded-2xl p-6 border border-gray-200/40 dark:border-white/10">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search hotels in... (e.g., Paris, Goa, Bangkok)"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                                Searching...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">search</span>
                                Search
                            </>
                        )}
                    </button>
                </form>

                {/* Quick Stats */}
                {budget && (
                    <div className="mt-4 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400">group</span>
                            <span className="text-gray-600 dark:text-gray-400">
                                {groupSize} {groupSize === 1 ? 'person' : 'people'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400">credit_card</span>
                            <span className="text-gray-600 dark:text-gray-400">
                                Budget: {formatAmount(budget)}/night
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters & Results */}
            {hotels.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1">
                        <HotelFilters
                            filters={filters}
                            onChange={handleFilterChange}
                            onApply={handleSearch}
                        />
                    </div>

                    {/* Hotel Results */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* AI Summary */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-purple-200/40 dark:border-purple-400/20">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl shrink-0">🤖</span>
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                                        AI Hotel Analysis
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Found {hotels.length} hotels.
                                        {budget && (
                                            <> {hotels.filter(h => h.affordabilityScore >= 80).length} are great value for your budget.</>
                                        )}
                                        {' '}Results sorted by affordability score.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Hotel Cards */}
                        {currentHotels.map((hotel) => (
                            <HotelCard
                                key={hotel.id}
                                hotel={hotel}
                                budget={budget}
                                groupSize={groupSize}
                            />
                        ))}

                        {currentHotels.length === 0 && !loading && (
                            <div className="text-center py-12 text-gray-400">
                                No hotels found. Try adjusting your filters.
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Showing {startIndex + 1}-{Math.min(endIndex, hotels.length)} of {hotels.length} hotels
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                                        Previous
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {[...Array(totalPages)].map((_, index) => {
                                            const page = index + 1;
                                            // Show first page, last page, current page, and pages around current
                                            if (
                                                page === 1 ||
                                                page === totalPages ||
                                                (page >= currentPage - 1 && page <= currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        className={`w-10 h-10 rounded-lg font-semibold transition-colors ${currentPage === page
                                                            ? 'bg-amber-400 text-black'
                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            } else if (
                                                page === currentPage - 2 ||
                                                page === currentPage + 2
                                            ) {
                                                return <span key={page} className="text-gray-400">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                    >
                                        Next
                                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {hotels.length === 0 && !loading && (
                <div className="text-center py-16">
                    <span className="text-6xl mb-4 block">🏨</span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Find Your Perfect Hotel
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Search for hotels in any city and get AI-powered recommendations
                    </p>
                </div>
            )}
        </div>
    );
};

export default HotelSearch;
