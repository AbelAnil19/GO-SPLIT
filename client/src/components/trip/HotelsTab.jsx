import React, { useState } from 'react';

const HotelsTab = () => {
    const [searchParams, setSearchParams] = useState({
        location: '',
        dates: '',
        guests: 2
    });

    const mockResults = [
        {
            id: 1,
            name: 'Grand Horizon Resort',
            location: 'Seminyak, Bali',
            rating: 4.8,
            reviews: 124,
            price: 12500,
            image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            amenities: ['Pool', 'Spa', 'Breakfast']
        },
        {
            id: 2,
            name: 'Ocean View Villa',
            location: 'Uluwatu, Bali',
            rating: 4.9,
            reviews: 89,
            price: 25000,
            image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            amenities: ['Private Pool', 'Ocean View', 'Butler']
        },
        {
            id: 3,
            name: 'Backpacker\'s Paradise',
            location: 'Canggu, Bali',
            rating: 4.5,
            reviews: 350,
            price: 3500,
            image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            amenities: ['WiFi', 'Bar', 'Social Events']
        }
    ];

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Search Card */}
            <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm backdrop-blur-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined">location_on</span>
                        <input
                            type="text"
                            placeholder="Where do you want to stay?"
                            className="w-full pl-10 pr-4 h-12 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-[#0d191b] dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                            value={searchParams.location}
                            onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                        />
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined">date_range</span>
                        <input
                            type="text"
                            placeholder="Check-in - Check-out"
                            className="w-full pl-10 pr-4 h-12 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-[#0d191b] dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                            value={searchParams.dates}
                            onChange={(e) => setSearchParams({ ...searchParams, dates: e.target.value })}
                        />
                    </div>
                    <button className="h-12 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl transition-colors shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">search</span>
                        Find Stays
                    </button>
                </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-bold text-[#0d191b] dark:text-white">Popular Stays</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Sort by:</span>
                        <select className="bg-transparent font-bold text-[#0d191b] dark:text-white outline-none cursor-pointer">
                            <option>Recommended</option>
                            <option>Price: Low to High</option>
                            <option>Rating</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockResults.map((hotel) => (
                        <div key={hotel.id} className="group bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden hover:border-amber-400/50 transition-all cursor-pointer flex flex-col">
                            {/* Image */}
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={hotel.image}
                                    alt={hotel.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold shadow-sm">
                                    <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                                    {hotel.rating} ({hotel.reviews})
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col flex-1">
                                <h4 className="font-bold text-lg text-[#0d191b] dark:text-white mb-1 group-hover:text-amber-400 transition-colors">{hotel.name}</h4>
                                <p className="text-sm text-gray-400 flex items-center gap-1 mb-3">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    {hotel.location}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {hotel.amenities.map((amenity, idx) => (
                                        <span key={idx} className="text-[10px] font-semibold px-2 py-1 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                            {amenity}
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                                    <div>
                                        <p className="text-xs text-gray-400">Price per night</p>
                                        <p className="text-xl font-black text-[#0d191b] dark:text-white">₹{hotel.price.toLocaleString()}</p>
                                    </div>
                                    <button className="size-10 rounded-full border border-gray-200 dark:border-white/20 flex items-center justify-center hover:bg-amber-400 hover:border-amber-400 hover:text-black transition-all">
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HotelsTab;
