import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';
import { getUserGroups, getBudgetAnalytics, setBudget } from '../firebase/firestore';
import DestinationCard from '../components/trip/DestinationCard';
import TransportTab from '../components/trip/TransportTab';
import HotelsTab from '../components/trip/HotelsTab';
import ActivitiesTab from '../components/trip/ActivitiesTab';
import ItineraryTab from '../components/trip/ItineraryTab';
import BudgetAnalyzer from '../components/trip/BudgetAnalyzer';
import SetBudgetModal from '../components/trip/SetBudgetModal';
import CreateTripModal from '../components/trip/CreateTripModal';
import TripDetailsModal from '../components/trip/TripDetailsModal';
import LocationSearch from '../components/trip/LocationSearch';
import { destinations as mockDestinations, filterOptions as initialFilters } from '../data/destinations';

const TripPlannerPage = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();

    const [userGroups, setUserGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [activeTab, setActiveTab] = useState('destinations');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState(initialFilters);
    const [destinations, setDestinations] = useState([]); // Start with empty - only show user-created trips
    const [loading, setLoading] = useState(true);
    const [budgetData, setBudgetData] = useState(null);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTripData, setNewTripData] = useState(null);
    const [isTripDetailsOpen, setIsTripDetailsOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [activeTripForPlanning, setActiveTripForPlanning] = useState(null); // Trip currently being planned in tabs

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

    // Fetch budget analytics when group changes
    useEffect(() => {
        const fetchBudget = async () => {
            if (!selectedGroup) {
                setBudgetData(null);
                return;
            }
            try {
                const analytics = await getBudgetAnalytics(selectedGroup.id);
                setBudgetData(analytics);
            } catch (error) {
                console.error('Error fetching budget:', error);
                // If budget doesn't exist, set default empty state
                setBudgetData({
                    totalBudget: 0,
                    utilized: 0,
                    avgDaily: 0,
                    estimatedFinal: 0,
                    remaining: 0,
                    utilizationPercent: 0
                });
            }
        };
        fetchBudget();
    }, [selectedGroup]);

    // Handle favorite toggle
    const handleFavorite = (destinationId) => {
        setDestinations(prev => prev.map(dest =>
            dest.id === destinationId ? { ...dest, isFavorite: !dest.isFavorite } : dest
        ));
    };

    // Handle view details
    const handleViewDetails = (destination) => {
        setSelectedTrip(destination);
        setIsTripDetailsOpen(true);
    };

    // Handle filter toggle
    const toggleFilter = (filterId) => {
        setFilters(prev => prev.map(filter =>
            filter.id === filterId ? { ...filter, active: !filter.active } : filter
        ));
    };

    // Handle budget save
    const handleSaveBudget = async (budgetInfo) => {
        if (!selectedGroup) return;
        await setBudget(selectedGroup.id, budgetInfo);
        // Refresh budget analytics
        const analytics = await getBudgetAnalytics(selectedGroup.id);
        setBudgetData(analytics);
    };

    // Filter destinations
    const filteredDestinations = destinations.filter(dest => {
        // Search filter
        const matchesSearch = dest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dest.location.toLowerCase().includes(searchQuery.toLowerCase());

        // Active filters
        const activeFilterIds = filters.filter(f => f.active).map(f => f.id);
        const matchesFilter = activeFilterIds.length === 0 || activeFilterIds.some(filterId => {
            if (filterId === 'my-trips') return dest.tags.includes('Custom Trip');
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
                    <div className="flex items-center justify-end gap-2 mb-1">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">AVAILABLE BUDGET</p>
                        <button
                            onClick={() => setIsBudgetModalOpen(true)}
                            className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                            title="Set Budget"
                        >
                            <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                    </div>
                    <p className="text-amber-500 dark:text-amber-400 font-black text-4xl">
                        ₹{budgetData ? budgetData.totalBudget.toLocaleString() : '0'}
                    </p>
                </div>
            </div>

            {/* Budget Analyzer */}
            {budgetData && budgetData.totalBudget > 0 ? (
                <BudgetAnalyzer
                    totalBudget={budgetData.totalBudget}
                    utilized={budgetData.utilized}
                    avgDaily={budgetData.avgDaily}
                    estimatedFinal={budgetData.estimatedFinal}
                    dailySpending={budgetData.dailySpending || []}
                    startDate={budgetData.startDate}
                    endDate={budgetData.endDate}
                />
            ) : (
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-2xl p-8 text-center">
                    <span className="material-symbols-outlined text-5xl text-amber-500/50 mb-4">trending_up</span>
                    <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-2">No Budget Set</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Set a budget to track your spending and get insights
                    </p>
                    <button
                        onClick={() => setIsBudgetModalOpen(true)}
                        className="px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors"
                    >
                        Set Budget Now
                    </button>
                </div>
            )}

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
                        <div className="flex-1 relative z-30">
                            <LocationSearch
                                onLocationSelect={(location) => {
                                    setNewTripData(location);
                                    setIsCreateModalOpen(true);
                                }}
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

                    {filteredDestinations.length === 0 && destinations.length === 0 && (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined text-6xl text-amber-400 mb-4">flight_takeoff</span>
                            <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold mb-2">No trips yet!</p>
                            <p className="text-gray-500 text-sm mb-4">Search for a city above to plan your first trip</p>
                            <div className="inline-flex items-center gap-2 text-amber-500 text-sm">
                                <span className="material-symbols-outlined text-lg">arrow_upward</span>
                                <span>Start by searching for a destination</span>
                            </div>
                        </div>
                    )}
                    {filteredDestinations.length === 0 && destinations.length > 0 && (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600 mb-4">travel_explore</span>
                            <p className="text-gray-700 dark:text-gray-400 text-lg">No trips match your filters</p>
                            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
                        </div>
                    )}
                </>
            )}

            {/* Transport Tab Content */}
            {activeTab === 'transport' && <TransportTab trip={activeTripForPlanning} />}

            {/* Hotels Tab Content */}
            {activeTab === 'hotels' && <HotelsTab trip={activeTripForPlanning} />}

            {/* Activities Tab Content */}
            {activeTab === 'activities' && <ActivitiesTab trip={activeTripForPlanning} />}

            {/* Itinerary Tab Content */}
            {activeTab === 'itinerary' && <ItineraryTab trip={activeTripForPlanning} />}

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

            {/* Set Budget Modal */}
            <SetBudgetModal
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                onSave={handleSaveBudget}
                currentBudget={budgetData}
            />

            {/* Create Trip Modal */}
            <CreateTripModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                initialData={newTripData}
                onSave={(trip) => {
                    setDestinations(prev => [trip, ...prev]);
                    setActiveTripForPlanning(trip); // Auto-select the new trip
                    addToast('Trip created successfully!', 'success');
                }}
            />

            {/* Trip Details Modal */}
            <TripDetailsModal
                isOpen={isTripDetailsOpen}
                onClose={() => setIsTripDetailsOpen(false)}
                trip={selectedTrip}
            />
        </div>
    );
};

export default TripPlannerPage;
