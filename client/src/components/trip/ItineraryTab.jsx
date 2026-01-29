import React, { useState } from 'react';

const ItineraryTab = () => {
    const [selectedDay, setSelectedDay] = useState(1);

    const itinerary = [
        {
            day: 1,
            date: 'Mon, 15 Jul',
            events: [
                { id: 1, time: '10:00 AM', title: 'Arrival at Denpasar Airport', type: 'transport', cost: 0, icon: 'flight_land' },
                { id: 2, time: '11:30 AM', title: 'Check-in at Grand Horizon Resort', type: 'hotel', cost: 0, icon: 'hotel' },
                { id: 3, time: '01:00 PM', title: 'Lunch at Beach Club', type: 'food', cost: 1500, icon: 'restaurant' },
                { id: 4, time: '04:00 PM', title: 'Relax at Seminyak Beach', type: 'leisure', cost: 0, icon: 'beach_access' },
                { id: 5, time: '07:00 PM', title: 'Welcome Dinner', type: 'food', cost: 2500, icon: 'restaurant_menu' }
            ]
        },
        {
            day: 2,
            date: 'Tue, 16 Jul',
            events: [
                { id: 6, time: '08:00 AM', title: 'Breakfast at Hotel', type: 'food', cost: 0, icon: 'bakery_dining' },
                { id: 7, time: '09:00 AM', title: 'Scuba Diving at Blue Lagoon', type: 'activity', cost: 4500, icon: 'scuba_diving' },
                { id: 8, time: '02:00 PM', title: 'Visit Tegalalang Rice Terrace', type: 'activity', cost: 500, icon: 'camera_alt' },
                { id: 9, time: '06:00 PM', title: 'Sunset at Tanah Lot', type: 'activity', cost: 200, icon: 'wb_twilight' }
            ]
        },
        {
            day: 3,
            date: 'Wed, 17 Jul',
            events: [
                { id: 10, time: '03:45 AM', title: 'Mount Batur Sunrise Trek', type: 'activity', cost: 3500, icon: 'hiking' },
                { id: 11, time: '12:00 PM', title: 'Rest & Recovery Spa', type: 'leisure', cost: 1200, icon: 'spa' },
                { id: 12, time: '07:00 PM', title: 'Farewell Party', type: 'party', cost: 5000, icon: 'nightlife' }
            ]
        }
    ];

    const currentDay = itinerary.find(d => d.day === selectedDay);

    return (
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in h-auto lg:h-[calc(100vh-300px)]">
            {/* Days Sidebar */}
            <div className="lg:w-1/4 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto pb-4 lg:pb-0">
                {itinerary.map((day) => (
                    <button
                        key={day.day}
                        onClick={() => setSelectedDay(day.day)}
                        className={`min-w-[120px] lg:w-full p-4 rounded-xl border transition-all text-left group ${selectedDay === day.day
                            ? 'bg-amber-400 border-amber-400 text-black shadow-lg shadow-amber-900/20'
                            : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-bold uppercase tracking-wider ${selectedDay === day.day ? 'text-black/60' : 'text-gray-400'}`}>
                                Day {day.day}
                            </span>
                            {selectedDay === day.day && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                        </div>
                        <p className={`font-bold text-lg ${selectedDay === day.day ? 'text-black' : 'text-[#0d191b] dark:text-white'}`}>
                            {day.date}
                        </p>
                        <p className={`text-xs mt-2 ${selectedDay === day.day ? 'text-black/70' : 'text-gray-400'}`}>
                            {day.events.length} events
                        </p>
                    </button>
                ))}

                <button className="min-w-[120px] lg:w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 text-gray-400 hover:text-amber-400 hover:border-amber-400/50 hover:bg-amber-400/5 transition-all text-sm font-bold flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-2xl">add_circle</span>
                    Add Day
                </button>
            </div>

            {/* Timeline View */}
            <div className="flex-1 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6 lg:overflow-y-auto relative custom-scrollbar">

                <div className="flex items-center justify-between mb-8 sticky top-0 bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-sm py-2 z-10 border-b border-gray-100 dark:border-white/5">
                    <div>
                        <h3 className="text-2xl font-black text-[#0d191b] dark:text-white">Day {currentDay.day} ITINERARY</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{currentDay.date}</p>
                    </div>
                    <button className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl transition-colors shadow-lg shadow-amber-900/20 flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-lg">add</span>
                        Add Event
                    </button>
                </div>

                <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-[11px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-200 dark:before:bg-white/10">
                    {currentDay.events.map((event, index) => (
                        <div key={event.id} className="relative group">
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[34px] sm:-left-[45px] top-1 z-10 size-6 rounded-full border-4 border-white dark:border-[#161b22] flex items-center justify-center ${event.type === 'transport' ? 'bg-blue-400' :
                                    event.type === 'hotel' ? 'bg-purple-400' :
                                        event.type === 'food' ? 'bg-orange-400' :
                                            event.type === 'activity' ? 'bg-amber-400' : 'bg-gray-400'
                                }`}>
                                <span className="material-symbols-outlined text-[10px] text-white">
                                    {event.icon}
                                </span>
                            </div>

                            {/* Event Card */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-black/20 hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-amber-400/30 transition-all cursor-pointer">
                                <div className="min-w-[80px]">
                                    <p className="text-sm font-bold text-[#0d191b] dark:text-white">{event.time}</p>
                                    <p className="text-xs text-gray-400 capitalize">{event.type}</p>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-[#0d191b] dark:text-white mb-1 group-hover:text-amber-400 transition-colors">{event.title}</h4>
                                    {event.cost > 0 && (
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Est. Cost: <span className="text-[#0d191b] dark:text-white">₹{event.cost}</span></p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="size-8 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button className="size-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* End Day Marker */}
                    <div className="relative pl-0">
                        <div className="absolute -left-[30px] sm:-left-[41px] top-1 z-10 size-4 rounded-full bg-gray-300 dark:bg-gray-700 border-2 border-white dark:border-[#161b22]"></div>
                        <p className="text-xs text-gray-400 italic pt-1">End of Day {currentDay.day}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItineraryTab;
