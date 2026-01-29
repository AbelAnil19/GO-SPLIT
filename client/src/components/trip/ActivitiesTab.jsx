import React, { useState } from 'react';

const ActivitiesTab = () => {
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Adventure', 'Culture', 'Relaxation', 'Food', 'Nightlife'];

    const mockActivities = [
        {
            id: 1,
            title: 'Scuba Diving at Blue Lagoon',
            location: 'Padang Bai, Bali',
            rating: 4.8,
            reviews: 215,
            price: 4500,
            duration: '4 hours',
            image: 'https://images.unsplash.com/photo-1544551763-46a42a4571da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            category: 'Adventure',
            tags: ['Water Sports', 'Guided']
        },
        {
            id: 2,
            title: 'Uluwatu Temple Sunset Tour',
            location: 'Uluwatu, Bali',
            rating: 4.9,
            reviews: 1840,
            price: 1200,
            duration: '3 hours',
            image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            category: 'Culture',
            tags: ['Sightseeing', 'Must Visit']
        },
        {
            id: 3,
            title: 'Traditional Balinese Cooking Class',
            location: 'Ubud, Bali',
            rating: 4.7,
            reviews: 320,
            price: 2800,
            duration: '5 hours',
            image: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            category: 'Food',
            tags: ['Workshop', 'Lunch Included']
        },
        {
            id: 4,
            title: 'Mount Batur Sunrise Trek',
            location: 'Kintamani, Bali',
            rating: 4.6,
            reviews: 850,
            price: 3500,
            duration: '8 hours',
            image: 'https://images.unsplash.com/photo-1542332213-31f87348057f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            category: 'Adventure',
            tags: ['Hiking', 'Sunrise']
        },
        {
            id: 5,
            title: 'Luxury Spa Day',
            location: 'Seminyak, Bali',
            rating: 4.9,
            reviews: 120,
            price: 5500,
            duration: '3 hours',
            image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            category: 'Relaxation',
            tags: ['Wellness', 'Massage']
        }
    ];

    const filteredActivities = activeCategory === 'All'
        ? mockActivities
        : mockActivities.filter(a => a.category === activeCategory);

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${activeCategory === cat
                            ? 'bg-amber-400 border-amber-400 text-black shadow-lg shadow-amber-900/20'
                            : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-[#0d191b] dark:hover:text-white'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActivities.map((activity) => (
                    <div key={activity.id} className="group bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden hover:border-amber-400/50 transition-all cursor-pointer flex flex-col h-full">
                        {/* Image */}
                        <div className="relative h-48 overflow-hidden">
                            <img
                                src={activity.image}
                                alt={activity.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold shadow-sm">
                                <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                                {activity.rating} ({activity.reviews})
                            </div>
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-white text-xs font-bold">
                                {activity.category}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex flex-col flex-1">
                            <h4 className="font-bold text-lg text-[#0d191b] dark:text-white mb-1 line-clamp-1 group-hover:text-amber-400 transition-colors">{activity.title}</h4>
                            <p className="text-sm text-gray-400 flex items-center gap-1 mb-3">
                                <span className="material-symbols-outlined text-sm">location_on</span>
                                {activity.location}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="text-[10px] font-semibold px-2 py-1 rounded bg-amber-100 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px]">schedule</span>
                                    {activity.duration}
                                </span>
                                {activity.tags.map((tag, idx) => (
                                    <span key={idx} className="text-[10px] font-semibold px-2 py-1 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                                <div>
                                    <p className="text-xs text-gray-400">Estimated cost</p>
                                    <p className="text-xl font-black text-[#0d191b] dark:text-white">₹{activity.price.toLocaleString()}</p>
                                </div>
                                <button className="px-4 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-[#0d191b] dark:text-white hover:bg-amber-400 hover:text-black hover:border-amber-400 transition-all flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">add</span>
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivitiesTab;
