import React from 'react';

const TripDetailsModal = ({ isOpen, onClose, trip }) => {
    if (!isOpen || !trip) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-[#1a1c23] rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Hero Image Header */}
                <div className="h-64 relative">
                    <img
                        src={trip.image}
                        alt={trip.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900 rounded-full text-gray-700 dark:text-white transition-all shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
                        title="Close"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>

                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-4xl font-black text-white mb-2">{trip.title}</h1>
                                <div className="flex items-center gap-2 text-white/90">
                                    <span className="material-symbols-outlined text-lg">location_on</span>
                                    <p className="text-lg">{trip.location}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-amber-500 text-xl">calendar_month</span>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Duration</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{trip.duration}</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-green-500 text-xl">payments</span>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Budget</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{trip.estimatedCost?.toLocaleString() || 0}</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-blue-500 text-xl">event</span>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Start Date</p>
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-purple-500 text-xl">event_available</span>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">End Date</p>
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {trip.endDate ? new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                            </p>
                        </div>
                    </div>

                    {/* Interactive Map */}
                    {trip.lat && trip.lon && (
                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
                            <div className="p-4 bg-white dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-500">map</span>
                                    Location Map
                                </h3>
                            </div>
                            <div className="h-64 bg-gray-200 dark:bg-gray-800 relative">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight="0"
                                    marginWidth="0"
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(trip.lon) - 0.05},${parseFloat(trip.lat) - 0.05},${parseFloat(trip.lon) + 0.05},${parseFloat(trip.lat) + 0.05}&layer=mapnik&marker=${trip.lat},${trip.lon}`}
                                    style={{ border: 0 }}
                                />
                            </div>
                            <div className="p-4 bg-white dark:bg-white/5 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Full Address:</span>
                                    <span className="text-gray-900 dark:text-white font-medium text-right max-w-[60%]">{trip.location}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Coordinates:</span>
                                    <span className="text-gray-900 dark:text-white font-mono text-xs">{trip.lat}, {trip.lon}</span>
                                </div>
                                <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                                    <a
                                        href={`https://www.google.com/maps?q=${trip.lat},${trip.lon}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-amber-500 hover:text-amber-600 transition-colors text-sm"
                                    >
                                        <span className="material-symbols-outlined text-base">open_in_new</span>
                                        Open in Google Maps
                                    </a>
                                    <span className="mx-2 text-gray-400">•</span>
                                    <a
                                        href={`https://www.openstreetmap.org/?mlat=${trip.lat}&mlon=${trip.lon}#map=13/${trip.lat}/${trip.lon}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors text-sm"
                                    >
                                        <span className="material-symbols-outlined text-base">open_in_new</span>
                                        Open in OpenStreetMap
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Trip Overview */}
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-5 border border-gray-200 dark:border-white/10">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500">description</span>
                            Trip Overview
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {trip.description || `Your exciting trip to ${trip.title}! This is your personalized travel plan.`}
                        </p>
                    </div>

                    {/* Coming Soon Features */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Itinerary Placeholder */}
                        <div className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/5 dark:to-white/0 rounded-xl p-5 border border-dashed border-gray-300 dark:border-white/20">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-gray-400">event_note</span>
                                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">Day-by-Day Itinerary</h3>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Coming soon! Plan your daily activities.</p>
                        </div>

                        {/* Notes Placeholder */}
                        <div className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/5 dark:to-white/0 rounded-xl p-5 border border-dashed border-gray-300 dark:border-white/20">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-gray-400">sticky_note_2</span>
                                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">Trip Notes</h3>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Coming soon! Add personal notes and reminders.</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        className="flex-1 px-6 py-3 rounded-xl bg-amber-400 text-black font-bold hover:bg-amber-500 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">edit</span>
                        Edit Trip
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TripDetailsModal;
