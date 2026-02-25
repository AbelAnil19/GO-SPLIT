import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';
import { getUserGroups, getBudgetAnalytics, setBudget, saveTrip, getGroupTrips, updateTrip, deleteTrip } from '../firebase/firestore';
import { useCurrency } from '../context/CurrencyContext';
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
    const { currency, currencySymbol, formatAmount } = useCurrency();

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

    // Fetch saved trips when group changes
    useEffect(() => {
        const fetchTrips = async () => {
            if (!selectedGroup) {
                setDestinations([]);
                return;
            }
            try {
                const trips = await getGroupTrips(selectedGroup.id);
                setDestinations(trips);
            } catch (error) {
                console.error('Error fetching trips:', error);
            }
        };
        fetchTrips();
    }, [selectedGroup]);

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
    const handleFavorite = async (destinationId) => {
        const dest = destinations.find(d => d.id === destinationId);
        if (!dest) return;
        const newFav = !dest.isFavorite;
        setDestinations(prev => prev.map(d =>
            d.id === destinationId ? { ...d, isFavorite: newFav } : d
        ));
        // Persist to Firestore
        if (selectedGroup) {
            try {
                await updateTrip(selectedGroup.id, destinationId, { isFavorite: newFav });
            } catch (error) {
                console.error('Error updating favorite:', error);
            }
        }
    };

    // Handle delete destination
    const handleDelete = async (destinationId) => {
        if (!window.confirm('Are you sure you want to delete this destination?')) return;
        setDestinations(prev => prev.filter(d => d.id !== destinationId));
        if (selectedGroup) {
            try {
                await deleteTrip(selectedGroup.id, destinationId);
                addToast('Destination deleted!', 'success');
            } catch (error) {
                console.error('Error deleting trip:', error);
                addToast('Failed to delete from cloud', 'error');
            }
        }
    };

    // Handle view details
    const handleViewDetails = (destination) => {
        setSelectedTrip(destination);
        setIsTripDetailsOpen(true);
    };

    // Handle plan trip (select for Transport/Hotels/Activities tabs)
    const handlePlanTrip = (destination) => {
        setActiveTripForPlanning(destination);
        addToast(`Planning ${destination.title} — switch to Transport, Hotels, or Activities tab!`, 'success');
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
                <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 leading-tight">Plan Your Travel Budget</h1>
                    {selectedGroup && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span className="material-symbols-outlined text-sm">group</span>
                            <select
                                value={selectedGroup.id}
                                onChange={(e) => setSelectedGroup(userGroups.find(g => g.id === e.target.value))}
                                className="bg-transparent text-sm font-medium hover:text-gray-900 dark:hover:text-white cursor-pointer outline-none"
                            >
                                {userGroups.map(group => (
                                    <option key={group.id} value={group.id} className="dark:bg-slate-800">
                                        GROUP: {group.name.toUpperCase()} 2024
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="text-left md:text-right bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] backdrop-blur-[2px] md:bg-none md:backdrop-filter-none border border-gray-200 dark:border-white/10 md:border-transparent p-4 rounded-2xl md:p-0 md:rounded-none mt-2 md:mt-0 shadow-sm md:shadow-none">
                    <div className="flex items-center justify-between md:justify-end gap-2 mb-1">
                        <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-bold tracking-wider uppercase">Available Budget</p>
                        <button
                            onClick={() => setIsBudgetModalOpen(true)}
                            className="flex items-center gap-1 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 transition-colors bg-amber-500/10 hover:bg-amber-500/20 md:bg-transparent md:hover:bg-transparent px-2 md:px-0 py-1 md:py-0 rounded-lg"
                            title="Set Budget"
                        >
                            <span className="material-symbols-outlined text-sm md:text-lg">edit</span>
                            <span className="text-xs font-bold md:hidden">Edit</span>
                        </button>
                    </div>
                    <p className="text-amber-500 dark:text-amber-400 font-black text-3xl md:text-4xl">
                        {formatAmount(budgetData ? budgetData.totalBudget : 0)}
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

            {/* Active Trip Indicator */}
            {activeTripForPlanning && (
                <div className="flex items-center justify-between bg-gradient-to-r from-amber-400/10 to-transparent border border-amber-400/20 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-amber-500">explore</span>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                Planning: {activeTripForPlanning.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Transport, Hotels & Activities will show results for this destination
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setActiveTripForPlanning(null); addToast('Trip deselected', 'info'); }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                        title="Clear selection"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-4 md:gap-8 bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] backdrop-blur-[2px] border border-gray-200 dark:border-white/10 rounded-2xl px-4 md:px-6 pt-3 md:pt-4 overflow-x-auto shadow-sm dark:shadow-none">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 md:gap-2 pb-3 md:pb-4 px-2 whitespace-nowrap transition-colors relative ${activeTab === tab.id
                            ? 'text-amber-500 dark:text-amber-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-lg md:text-xl">{tab.icon}</span>
                        <span className="text-sm md:text-base font-semibold">{tab.label}</span>
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
                                        ? 'bg-amber-400 text-black shadow-md'
                                        : 'bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] backdrop-blur-[2px] text-gray-600 dark:text-gray-400 hover:border-amber-400/50 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-white/10 shadow-sm dark:shadow-none'
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
                                onDelete={handleDelete}
                                onPlanTrip={handlePlanTrip}
                                isActivePlan={activeTripForPlanning?.id === destination.id}
                            />
                        ))}

                        {/* Add Custom Destination Card */}
                        <div
                            onClick={() => {
                                setNewTripData(null);
                                setIsCreateModalOpen(true);
                            }}
                            className="bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] backdrop-blur-[2px] rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-amber-400/50 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center p-8 min-h-[400px] cursor-pointer group shadow-md dark:shadow-none"
                        >
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
            {activeTab === 'hotels' && (
                <HotelsTab
                    trip={activeTripForPlanning}
                    groupSize={selectedGroup?.members?.length || 1}
                    budget={budgetData?.accommodation || null}
                />
            )}

            {/* Activities Tab Content */}
            {activeTab === 'activities' && (
                <ActivitiesTab
                    trip={activeTripForPlanning}
                    onUpdateTrip={async (updates) => {
                        const newTrip = { ...activeTripForPlanning, ...updates };
                        setActiveTripForPlanning(newTrip);
                        setDestinations(prev => prev.map(d => d.id === newTrip.id ? newTrip : d));
                        if (selectedGroup) {
                            try {
                                await updateTrip(selectedGroup.id, newTrip.id, updates);
                            } catch (e) {
                                console.error('Failed to update trip:', e);
                            }
                        }
                    }}
                />
            )}

            {/* Itinerary Tab Content */}
            {activeTab === 'itinerary' && (
                <ItineraryTab
                    groupId={selectedGroup?.id}
                    groupData={selectedGroup}
                    savedTrips={destinations}
                    activeTrip={activeTripForPlanning}
                />
            )}

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
                onSave={async (trip) => {
                    if (selectedGroup) {
                        try {
                            if (trip.id) {
                                // EDIT mode - try updating existing trip in Firestore
                                try {
                                    await updateTrip(selectedGroup.id, trip.id, {
                                        title: trip.title,
                                        location: trip.location,
                                        startDate: trip.startDate,
                                        endDate: trip.endDate,
                                        estimatedCost: trip.estimatedCost,
                                        duration: trip.duration,
                                        image: trip.image || null,
                                        tags: trip.tags || ['Custom Trip'],
                                    });
                                    setDestinations(prev => prev.map(d =>
                                        d.id === trip.id ? { ...d, ...trip } : d
                                    ));
                                    setActiveTripForPlanning(trip);
                                    addToast('Trip updated!', 'success');
                                } catch (updateError) {
                                    // Trip doesn't exist in Firestore (old local-only trip) — save as new
                                    console.warn('Trip not in Firestore, saving as new:', updateError.message);
                                    const { id: oldId, ...tripWithoutId } = trip;
                                    const savedTrip = await saveTrip(selectedGroup.id, {
                                        ...tripWithoutId,
                                        tags: trip.tags || ['Custom Trip'],
                                        isFavorite: trip.isFavorite || false
                                    });
                                    // Replace old local entry with new Firestore-backed one
                                    setDestinations(prev => prev.map(d =>
                                        d.id === oldId ? savedTrip : d
                                    ));
                                    setActiveTripForPlanning(savedTrip);
                                    addToast('Trip saved to cloud!', 'success');
                                }
                            } else {
                                // CREATE mode - new trip
                                const savedTrip = await saveTrip(selectedGroup.id, {
                                    ...trip,
                                    tags: trip.tags || ['Custom Trip'],
                                    isFavorite: false
                                });
                                setDestinations(prev => [savedTrip, ...prev]);
                                setActiveTripForPlanning(savedTrip);
                                addToast('Trip created and saved!', 'success');
                            }
                        } catch (error) {
                            console.error('Error saving trip:', error);
                            if (!trip.id) {
                                setDestinations(prev => [trip, ...prev]);
                            }
                            setActiveTripForPlanning(trip);
                            addToast('Trip created (not saved to cloud)', 'warning');
                        }
                    } else {
                        setDestinations(prev => [trip, ...prev]);
                        setActiveTripForPlanning(trip);
                        addToast('Trip created! Select a group to save permanently.', 'info');
                    }
                }}
            />

            {/* Trip Details Modal */}
            <TripDetailsModal
                isOpen={isTripDetailsOpen}
                onClose={() => setIsTripDetailsOpen(false)}
                trip={selectedTrip}
                onEdit={(tripData, notesOnly) => {
                    if (notesOnly) {
                        // Save notes to Firestore
                        if (selectedGroup && tripData.id) {
                            updateTrip(selectedGroup.id, tripData.id, { notes: tripData.notes })
                                .then(() => {
                                    // Update local state
                                    setDestinations(prev => prev.map(d =>
                                        d.id === tripData.id ? { ...d, notes: tripData.notes } : d
                                    ));
                                    addToast('Notes saved!', 'success');
                                })
                                .catch(err => console.error('Error saving notes:', err));
                        }
                    } else {
                        // Open CreateTripModal for full editing
                        setIsTripDetailsOpen(false);
                        setNewTripData(tripData);
                        setIsCreateModalOpen(true);
                    }
                }}
                onViewItinerary={() => {
                    setIsTripDetailsOpen(false);
                    setActiveTab('itinerary');
                }}
            />
        </div>
    );
};

export default TripPlannerPage;
