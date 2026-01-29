import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';
import { getUserGroups } from '../firebase/firestore';
import DestinationCard from '../components/trip/DestinationCard';
import TransportTab from '../components/trip/TransportTab';
import HotelsTab from '../components/trip/HotelsTab';
import ActivitiesTab from '../components/trip/ActivitiesTab';
import ItineraryTab from '../components/trip/ItineraryTab';
import BudgetAnalyzer from '../components/trip/BudgetAnalyzer';
import { destinations as mockDestinations, filterOptions as initialFilters } from '../data/destinations';

const TripPlannerPage = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();

    const [userGroups, setUserGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [activeTab, setActiveTab] = useState('destinations');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState(initialFilters);
    const [destinations, setDestinations] = useState(mockDestinations);
    const [loading, setLoading] = useState(true);

    // Fetch user groups
    useEffect(() => {
        const fetchGroups = async () => {
            if (!currentUser) return;
            try {
                const groups = await getUserGroups(currentUser.uid);
                setUserGroups(groups);
                if (groups.length > 0) {
                    setSelectedGroup(groups[0]);
                }
            } catch (error) {
                console.error('Error fetching groups:', error);
                addToast('Failed to load groups', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchGroups();
    }, [currentUser, addToast]);

    // Handle favorite toggle
    const handleFavorite = (destinationId) => {
        setDestinations(prev => prev.map(dest =>
            dest.id === destinationId ? { ...dest, isFavorite: !dest.isFavorite } : dest
        ));
    };

    // Handle view details
    const handleViewDetails = (destination) => {
        addToast(`Viewing ${destination.title}`, 'info');
        // TODO: Open modal with full details
    };

    // Handle filter toggle
    const toggleFilter = (filterId) => {
        setFilters(prev => prev.map(filter =>
            filter.id === filterId ? { ...filter, active: !filter.active } : filter
        ));
    };

    // Filter destinations
    const filteredDestinations = destinations.filter(dest => {
        // Search filter
        const matchesSearch = dest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dest.location.toLowerCase().includes(searchQuery.toLowerCase());

        // Active filters
        const activeFilterIds = filters.filter(f => f.active).map(f => f.id);
        const matchesFilter = activeFilterIds.length === 0 || activeFilterIds.some(filterId => {
            if (filterId === 'budget-friendly') return dest.tags.includes('Budget-Friendly');
            if (filterId === 'luxury') return dest.tags.includes('Premium');
            if (filterId === 'nature') return dest.category === 'Nature';
            return true;
        });

        return matchesSearch && matchesFilter;
    });

    const tabs = [
        { id: 'destinations', label: 'Destinations', icon: 'flight_takeoff' },
        { id: 'transport', label: 'Transport', icon: 'directions_car' },
        { id: 'hotels', label: 'Hotels', icon: 'hotel' },
        { id: 'activities', label: 'Activities', icon: 'local_activity' },
        { id: 'itinerary', label: 'Itinerary', icon: 'calendar_month' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading travel budget...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Plan Your Travel Budget</h1>
                    {selectedGroup && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span className="material-symbols-outlined text-sm">group</span>
                            <select
                                value={selectedGroup.id}
                                onChange={(e) => setSelectedGroup(userGroups.find(g => g.id === e.target.value))}
                                className="bg-transparent text-sm font-medium hover:text-gray-900 dark:hover:text-white cursor-pointer outline-none"
                            >
                                {userGroups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        GROUP: {group.name.toUpperCase()} 2024
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="text-right">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">AVAILABLE BUDGET</p>
                    <p className="text-amber-500 dark:text-amber-400 font-black text-4xl">₹85,000</p>
                </div>
            </div>

            {/* Budget Analyzer */}
            <BudgetAnalyzer
                totalBudget={85000}
                utilized={15000}
                avgDaily={1250}
                estimatedFinal={72000}
            />

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-gray-200 dark:border-white/10 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 pb-4 px-2 whitespace-nowrap transition-colors relative ${activeTab === tab.id
                            ? 'text-amber-500 dark:text-amber-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                        <span className="font-semibold">{tab.label}</span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 dark:bg-amber-400"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Destinations Tab Content */}
            {activeTab === 'destinations' && (
                <>
                    {/* Search & Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                search
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search cities, regions or attractions..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50 transition-colors"
                            />
                        </div>

                        {/* Filter Chips */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {filters.map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => toggleFilter(filter.id)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filter.active
                                        ? 'bg-amber-400 text-black'
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-white/10'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Destinations Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDestinations.map(destination => (
                            <DestinationCard
                                key={destination.id}
                                destination={destination}
                                onFavorite={handleFavorite}
                                onViewDetails={handleViewDetails}
                            />
                        ))}

                        {/* Add Custom Destination Card */}
                        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-amber-400/50 transition-colors flex flex-col items-center justify-center p-8 min-h-[400px] cursor-pointer group">
                            <div className="w-16 h-16 rounded-full bg-amber-400/10 flex items-center justify-center mb-4 group-hover:bg-amber-400/20 transition-colors">
                                <span className="material-symbols-outlined text-4xl text-amber-500 dark:text-amber-400">add_location</span>
                            </div>
                            <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Add Custom Destination</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
                                Have somewhere specific in mind? Add it to your group wishlist.
                            </p>
                        </div>
                    </div>

                    {filteredDestinations.length === 0 && (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600 mb-4">travel_explore</span>
                            <p className="text-gray-700 dark:text-gray-400 text-lg">No destinations match your filters</p>
                            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
                        </div>
                    )}
                </>
            )}

            {/* Transport Tab Content */}
            {activeTab === 'transport' && <TransportTab />}

            {/* Hotels Tab Content */}
            {activeTab === 'hotels' && <HotelsTab />}

            {/* Activities Tab Content */}
            {activeTab === 'activities' && <ActivitiesTab />}

            {/* Itinerary Tab Content */}
            {activeTab === 'itinerary' && <ItineraryTab />}

            {/* Placeholder for other tabs */}
            {activeTab !== 'destinations' && activeTab !== 'transport' && activeTab !== 'hotels' && activeTab !== 'activities' && activeTab !== 'itinerary' && (
                <div className="text-center py-20">
                    <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">
                        {tabs.find(t => t.id === activeTab)?.icon}
                    </span>
                    <p className="text-gray-400 text-lg font-semibold">
                        {tabs.find(t => t.id === activeTab)?.label} - Coming Soon!
                    </p>
                    <p className="text-gray-500 text-sm mt-2">This feature is under development</p>
                </div>
            )}
        </div>
    );
};

export default TripPlannerPage;
