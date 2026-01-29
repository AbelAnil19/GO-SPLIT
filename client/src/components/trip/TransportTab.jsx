import React, { useState } from 'react';

const TransportTab = () => {
    const [mode, setMode] = useState('flight'); // 'flight', 'train', 'bus'
    const [searchParams, setSearchParams] = useState({
        from: '',
        to: '',
        date: '',
        passengers: 1
    });

    const mockResults = [
        {
            id: 1,
            mode: 'flight',
            provider: 'Sky Airlines',
            logo: 'flight',
            departure: '08:00 AM',
            arrival: '10:30 AM',
            duration: '2h 30m',
            price: 4500,
            type: 'Non-stop'
        },
        {
            id: 2,
            mode: 'flight',
            provider: 'Air Jet',
            logo: 'flight_takeoff',
            departure: '01:15 PM',
            arrival: '04:00 PM',
            duration: '2h 45m',
            price: 3800,
            type: '1 Stop'
        },
        {
            id: 3,
            mode: 'train',
            provider: 'Express Rail',
            logo: 'train',
            departure: '06:00 AM',
            arrival: '02:00 PM',
            duration: '8h 00m',
            price: 1200,
            type: 'Sleeper'
        }
    ];

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Search Card */}
            <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm backdrop-blur-md">
                {/* Mode Selector */}
                <div className="flex gap-4 border-b border-gray-200 dark:border-white/10 pb-4 mb-4">
                    {['flight', 'train', 'bus', 'directions_car'].map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === m
                                ? 'bg-amber-400 text-black shadow-lg shadow-amber-900/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className="material-symbols-outlined">
                                {m === 'flight' ? 'flight' : m === 'train' ? 'train' : m === 'bus' ? 'directions_bus' : 'directions_car'}
                            </span>
                            <span className="capitalize">{m === 'directions_car' ? 'Car' : m}</span>
                        </button>
                    ))}
                </div>

                {/* Search Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined">flight_takeoff</span>
                        <input
                            type="text"
                            placeholder="From"
                            className="w-full pl-10 pr-4 h-12 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-[#0d191b] dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                            value={searchParams.from}
                            onChange={(e) => setSearchParams({ ...searchParams, from: e.target.value })}
                        />
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined">flight_land</span>
                        <input
                            type="text"
                            placeholder="To"
                            className="w-full pl-10 pr-4 h-12 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-[#0d191b] dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                            value={searchParams.to}
                            onChange={(e) => setSearchParams({ ...searchParams, to: e.target.value })}
                        />
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined">calendar_today</span>
                        <input
                            type="date"
                            className="w-full pl-10 pr-4 h-12 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-[#0d191b] dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                            value={searchParams.date}
                            onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                        />
                    </div>
                    <button className="h-12 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl transition-colors shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">search</span>
                        Search
                    </button>
                </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#0d191b] dark:text-white px-2">Recommended Options</h3>

                {mockResults.filter(r => r.mode === 'flight' || mode === 'all').map((result) => (
                    <div key={result.id} className="bg-white dark:bg-white/5 p-4 md:p-6 rounded-xl border border-gray-200 dark:border-white/10 hover:border-amber-400/50 transition-all group cursor-pointer flex flex-col md:flex-row items-center gap-6">
                        {/* Provider Info */}
                        <div className="flex items-center gap-4 w-full md:w-1/4">
                            <div className="size-12 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400">
                                <span className="material-symbols-outlined">{result.logo}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-[#0d191b] dark:text-white">{result.provider}</h4>
                                <p className="text-xs text-gray-400">{result.type}</p>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="flex-1 flex items-center justify-center gap-6 w-full">
                            <div className="text-center">
                                <p className="font-bold text-lg text-[#0d191b] dark:text-white">{result.departure}</p>
                                <p className="text-xs text-gray-400">BLR</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-xs text-gray-500 font-medium">{result.duration}</span>
                                <div className="w-full h-0.5 bg-gray-300 dark:bg-white/10 relative">
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 size-2 rounded-full bg-amber-400"></div>
                                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xs bg-[#0d191b] px-1">flight</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-lg text-[#0d191b] dark:text-white">{result.arrival}</p>
                                <p className="text-xs text-gray-400">DEL</p>
                            </div>
                        </div>

                        {/* Price & Action */}
                        <div className="w-full md:w-auto flex items-center justify-between md:flex-col md:items-end gap-2 pl-6 md:border-l border-gray-200 dark:border-white/10">
                            <p className="text-2xl font-black text-[#0d191b] dark:text-white">₹{result.price.toLocaleString()}</p>
                            <button className="px-6 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-bold text-[#0d191b] dark:text-white hover:bg-amber-400 hover:text-black hover:border-amber-400 transition-all">
                                Select
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TransportTab;
