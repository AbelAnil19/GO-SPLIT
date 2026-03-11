// Mock destination data for Trip Planner
export const destinations = [
    {
        id: 1,
        title: 'Ubud Tropical Retreat',
        location: 'Bali, Indonesia',
        image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800',
        estimatedCost: 12400,
        duration: '3 Days Rec.',
        tags: ['Budget-Friendly'],
        category: 'Nature',
        description: 'Experience the lush greenery and volcanic landscapes of Ubud with traditional Balinese culture.',
        isFavorite: false
    },
    {
        id: 2,
        title: 'Historic Gion District',
        location: 'Kyoto, Japan',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
        estimatedCost: 28500,
        duration: '4 Days Rec.',
        tags: ['Premium'],
        category: 'Cultural',
        description: 'Explore ancient temples, traditional tea houses, and geisha districts in historic Kyoto.',
        isFavorite: false
    },
    {
        id: 3,
        title: 'Urban Oasis City',
        location: 'Marina Bay, Singapore',
        image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
        estimatedCost: 18900,
        duration: '3 Days Rec.',
        tags: ['Best Value'],
        category: 'Urban',
        description: 'Modern cityscape with gardens, shopping, and world-class dining experiences.',
        isFavorite: false
    },
    {
        id: 4,
        title: 'Phi Phi Island Tour',
        location: 'Phuket, Thailand',
        image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
        estimatedCost: 9800,
        duration: '3 Days Rec.',
        tags: ['Budget-Friendly'],
        category: 'Nature',
        description: 'Crystal clear waters, limestone cliffs, and vibrant marine life in tropical paradise.',
        isFavorite: false
    },
    {
        id: 5,
        title: 'Swiss Alps Adventure',
        location: 'Interlaken, Switzerland',
        image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
        estimatedCost: 45000,
        duration: '5 Days Rec.',
        tags: ['Premium'],
        category: 'Adventure',
        description: 'Paragliding, skiing, and mountain hiking in the stunning Swiss Alps.',
        isFavorite: false
    },
    {
        id: 6,
        title: 'Santorini Sunset',
        location: 'Santorini, Greece',
        image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
        estimatedCost: 32000,
        duration: '4 Days Rec.',
        tags: ['Premium'],
        category: 'Luxury',
        description: 'White-washed buildings, blue domes, and breathtaking sunsets over the Aegean Sea.',
        isFavorite: false
    },
    {
        id: 7,
        title: 'Jaipur Heritage Walk',
        location: 'Jaipur, India',
        image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800',
        estimatedCost: 8500,
        duration: '2 Days Rec.',
        tags: ['Budget-Friendly'],
        category: 'Cultural',
        description: 'Explore palaces, forts, and colorful bazaars in the Pink City.',
        isFavorite: false
    },
    {
        id: 8,
        title: 'Iceland Ring Road',
        location: 'Reykjavik, Iceland',
        image: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800',
        estimatedCost: 52000,
        duration: '6 Days Rec.',
        tags: ['Premium'],
        category: 'Adventure',
        description: 'Waterfalls, glaciers, hot springs, and the Northern Lights.',
        isFavorite: false
    }
];

export const filterOptions = [
    { id: 'my-trips', label: 'My Trips', active: false },
    { id: 'budget-friendly', label: 'Budget-Friendly', active: false },
    { id: 'popular', label: 'Popular', active: false },
    { id: 'nature', label: 'Nature', active: false },
    { id: 'solo-friendly', label: 'Solo Friendly', active: false },
    { id: 'luxury', label: 'Luxury', active: false }
];
