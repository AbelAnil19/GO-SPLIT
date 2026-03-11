import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const { currencySymbol, formatAmount } = useCurrency();

    const [userGroups, setUserGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [activeTab, setActiveTab] = useState('destinations');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState(initialFilters);
    const [timeFilter, setTimeFilter] = useState('upcoming'); // Add time filter state
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
                addToast(t('tripPlanner.successLoad'), 'error');
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
        if (!window.confirm(t('tripPlanner.deleteConfirm'))) return;
        setDestinations(prev => prev.filter(d => d.id !== destinationId));
        if (selectedGroup) {
            try {
                await deleteTrip(selectedGroup.id, destinationId);
                addToast(t('tripPlanner.deleteSuccess'), 'success');
            } catch (error) {
                console.error('Error deleting trip:', error);
                addToast(t('tripPlanner.deleteFail'), 'error');
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
        addToast(t('tripPlanner.planToast', { title: destination.title }), 'success');
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
            if (filterId === 'popular') return dest.tags.includes('Popular');
            if (filterId === 'solo-friendly') return dest.tags.includes('Solo-Friendly');
            return true;
        });

        // Time filter (Upcoming vs Past)
        const today = new Date();
        // Reset time to midnight for accurate day comparison
        today.setHours(0, 0, 0, 0);

        let matchesTime = true;
        if (dest.endDate) {
            const tripEndDate = new Date(dest.endDate);
            const isPast = tripEndDate < today;

            if (timeFilter === 'upcoming') {
                matchesTime = !isPast;
            } else if (timeFilter === 'past') {
                matchesTime = isPast;
            }
        } else {
            // If a trip has no end date, we consider it upcoming/ongoing
            matchesTime = timeFilter === 'upcoming';
        }

        return matchesSearch && matchesFilter && matchesTime;
    });

    const tabs = [
        { id: 'destinations', label: t('tripPlanner.destinations'), icon: 'flight_takeoff' },
        { id: 'transport', label: t('tripPlanner.transport'), icon: 'directions_car' },
        { id: 'hotels', label: t('tripPlanner.hotels'), icon: 'hotel' },
        { id: 'activities', label: t('tripPlanner.activities'), icon: 'local_activity' },
        { id: 'itinerary', label: t('tripPlanner.itinerary'), icon: 'calendar_month' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
                    <p className="text-gray-400">{t('tripPlanner.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 leading-tight">{t('tripPlanner.pageTitle')}</h1>
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
                                        {group.name.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="text-left md:text-right bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] backdrop-blur-[2px] md:bg-none md:backdrop-filter-none border border-gray-200 dark:border-white/10 md:border-transparent p-4 rounded-2xl md:p-0 md:rounded-none mt-2 md:mt-0 shadow-sm md:shadow-none">
                    <div className="flex items-center justify-between md:justify-end gap-2 mb-1">
                        <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-bold tracking-wider uppercase">{t('tripPlanner.availableBudget')}</p>
                        <button
                            onClick={() => setIsBudgetModalOpen(true)}
                            className="flex items-center gap-1 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 transition-colors bg-amber-500/10 hover:bg-amber-500/20 md:bg-transparent md:hover:bg-transparent px-2 md:px-0 py-1 md:py-0 rounded-lg"
                            title={t('tripPlanner.setBudget')}
                        >
                            <span className="material-symbols-outlined text-sm md:text-lg">edit</span>
                            <span className="text-xs font-bold md:hidden">{t('tripPlanner.edit')}</span>
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
                    <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-2">{t('tripPlanner.noBudgetTitle')}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {t('tripPlanner.noBudgetDesc')}
                    </p>
                    <button
                        onClick={() => setIsBudgetModalOpen(true)}
                        className="px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors"
                    >
                        {t('tripPlanner.setBudgetNow')}
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
                                {t('tripPlanner.planning')} {activeTripForPlanning.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('tripPlanner.planningDesc')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setActiveTripForPlanning(null); addToast(t('tripPlanner.tripDeselected'), 'info'); }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                        title={t('tripPlanner.clearSelection')}
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
                                    {filter.id === 'my-trips' ? t('tripPlanner.filters.myTrips') :
                                        filter.id === 'budget-friendly' ? t('tripPlanner.filters.budgetFriendly') :
                                            filter.id === 'popular' ? t('tripPlanner.filters.popular') :
                                                filter.id === 'nature' ? t('tripPlanner.filters.nature') :
                                                    filter.id === 'solo-friendly' ? t('tripPlanner.filters.soloFriendly') :
                                                        filter.id === 'luxury' ? t('tripPlanner.filters.luxury') :
                                                            filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Filter Tabs (Upcoming / Past) */}
                    <div className="flex bg-gray-100 dark:bg-black/30 w-fit rounded-lg p-1 border border-gray-200 dark:border-white/10">
                        <button
                            onClick={() => setTimeFilter('upcoming')}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${timeFilter === 'upcoming' ? 'bg-white dark:bg-white/10 text-amber-500 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">event_upcoming</span>
                                Upcoming
                            </div>
                        </button>
                        <button
                            onClick={() => setTimeFilter('past')}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${timeFilter === 'past' ? 'bg-white dark:bg-white/10 text-amber-500 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">history</span>
                                Past
                            </div>
                        </button>
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

                        {/* Add Custom Destination Card - Only show in Upcoming */}
                        {timeFilter === 'upcoming' && (
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
                                <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-2">{t('tripPlanner.addCustomDestination')}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
                                    {t('tripPlanner.addCustomDesc')}
                                </p>
                            </div>
                        )}
                    </div>

                    {filteredDestinations.length === 0 && destinations.length === 0 && (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined text-6xl text-amber-400 mb-4">flight_takeoff</span>
                            <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold mb-2">{t('tripPlanner.noTripsTitle')}</p>
                            <p className="text-gray-500 text-sm mb-4">{t('tripPlanner.noTripsDesc')}</p>
                            <div className="inline-flex items-center gap-2 text-amber-500 text-sm">
                                <span className="material-symbols-outlined text-lg">arrow_upward</span>
                                <span>{t('tripPlanner.startSearching')}</span>
                            </div>
                        </div>
                    )}
                    {filteredDestinations.length === 0 && destinations.length > 0 && (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600 mb-4">travel_explore</span>
                            <p className="text-gray-700 dark:text-gray-400 text-lg">{t('tripPlanner.noFilterMatchTitle')}</p>
                            <p className="text-gray-500 text-sm">{t('tripPlanner.noFilterMatchDesc')}</p>
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
                        {tabs.find(t => t.id === activeTab)?.label} - {t('tripPlanner.comingSoon')}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">{t('tripPlanner.underDevelopment')}</p>
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
                                    addToast(t('tripPlanner.tripUpdated'), 'success');
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
                                    addToast(t('tripPlanner.tripSaved'), 'success');
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
                                addToast(t('tripPlanner.tripCreatedSaved'), 'success');
                            }
                        } catch (error) {
                            console.error('Error saving trip:', error);
                            if (!trip.id) {
                                setDestinations(prev => [trip, ...prev]);
                            }
                            setActiveTripForPlanning(trip);
                            addToast(t('tripPlanner.tripCreatedWarn'), 'warning');
                        }
                    } else {
                        setDestinations(prev => [trip, ...prev]);
                        setActiveTripForPlanning(trip);
                        addToast(t('tripPlanner.tripCreatedInfo'), 'info');
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
                                    addToast(t('tripPlanner.notesSaved'), 'success');
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
