// Hotel Service - Using OpenStreetMap Overpass API (100% FREE)

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';
const NOMINATIM_API = 'https://nominatim.openstreetmap.org';
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

/**
 * Search hotels in a city using OpenStreetMap or Geoapify
 */
export const searchHotelsByCity = async (cityName, filters = {}) => {
    try {
        // Geocode city first to get coordinates/bounds
        const geocodeResponse = await fetch(
            `${NOMINATIM_API}/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`,
            {
                headers: {
                    'User-Agent': 'GoSplit-TripPlanner/1.0'
                }
            }
        );

        const geocodeData = await geocodeResponse.json();

        if (!geocodeData || geocodeData.length === 0) {
            return { success: false, error: 'City not found' };
        }

        const { boundingbox, lat, lon } = geocodeData[0];

        // Try Geoapify with coordinates if API key is present
        if (GEOAPIFY_API_KEY && GEOAPIFY_API_KEY !== 'YOUR_GEOAPIFY_API_KEY_HERE') {
            const geoapifyResult = await searchHotelsGeoapify(lat, lon, boundingbox, filters);
            if (geoapifyResult.success && geoapifyResult.data.length > 0) {
                return geoapifyResult;
            }
        }

        // Fallback to Overpass
        return await searchHotelsInBounds(boundingbox, filters);
    } catch (error) {
        console.error('Error searching hotels:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Search hotels using Geoapify
 * Now uses filter to avoid 400 errors
 */
const searchHotelsGeoapify = async (lat, lon, boundingbox, filters = {}) => {
    try {
        const categories = 'accommodation.hotel,accommodation.hostel,accommodation.guest_house';
        const [south, north, west, east] = boundingbox;

        // Use rect filter for city-wide search
        const filter = `rect:${west},${south},${east},${north}`;
        const bias = `proximity:${lon},${lat}`;

        const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=${filter}&bias=${bias}&limit=30&apiKey=${GEOAPIFY_API_KEY}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Geoapify error: ${response.status}`);

        const data = await response.json();

        const hotels = data.features.map(transformGeoapifyToHotel);

        // Apply AI price estimation
        const hotelsWithPrices = hotels.map(hotel => ({
            ...hotel,
            ...estimateHotelPrice(hotel, filters.groupSize || 1)
        }));

        // Apply filters
        let filtered = applyFilters(hotelsWithPrices, filters);

        // Sort by AI affordability score
        filtered = filtered.sort((a, b) => (b.affordabilityScore || 0) - (a.affordabilityScore || 0));

        return { success: true, data: filtered };
    } catch (error) {
        console.error('Geoapify Hotel Search Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Transform Geoapify data to our hotel format
 */
const transformGeoapifyToHotel = (feature) => {
    const props = feature.properties;
    const type = props.categories[0]?.split('.').pop() || 'hotel';

    return {
        id: props.place_id,
        name: props.name || props.street || 'Unknown Hotel',
        type: type,
        location: {
            lat: props.lat,
            lon: props.lon,
            address: props.formatted,
            city: props.city || null,
            postcode: props.postcode || null
        },
        contact: {
            phone: props.contact?.phone || null,
            website: props.website || null,
            email: props.contact?.email || null
        },
        amenities: Array.isArray(props.facilities) ? props.facilities : [],
        stars: props.rating || estimateStarsFromTags(props),
        description: null,
        image: getHotelImage(type),
        rawTags: props
    };
};

/**
 * Search hotels in a bounding box
 */
export const searchHotelsInBounds = async (boundingbox, filters = {}) => {
    try {
        const [south, north, west, east] = boundingbox;

        // Overpass QL query for hotels, hostels, guesthouses
        const query = `
            [out:json][timeout:25];
            (
                node["tourism"="hotel"](${south},${west},${north},${east});
                way["tourism"="hotel"](${south},${west},${north},${east});
                node["tourism"="hostel"](${south},${west},${north},${east});
                node["tourism"="guest_house"](${south},${west},${north},${east});
            );
            out body;
            >;
            out skel qt;
        `;

        const response = await fetch(OVERPASS_API, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            signal: AbortSignal.timeout(15000) // 15 second timeout
        });

        if (!response.ok) {
            console.warn(`Overpass API returned ${response.status}`);
            return { success: false, error: `Hotel search service returned error (${response.status}). Please try again.` };
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('Overpass API returned non-JSON response');
            return { success: false, error: 'Hotel search service returned an unexpected response. Please try again.' };
        }

        const data = await response.json();

        if (!data.elements || data.elements.length === 0) {
            return { success: true, data: [] }; // Genuinely no hotels found
        }

        // Transform OSM data to our hotel format
        const hotels = data.elements
            .filter(el => el.tags && el.tags.name && (el.lat || el.center))
            .map(transformOSMToHotel)
            .filter(hotel => hotel !== null);

        // Apply AI price estimation
        const hotelsWithPrices = hotels.map(hotel => ({
            ...hotel,
            ...estimateHotelPrice(hotel, filters.groupSize || 1)
        }));

        // Apply filters
        let filtered = applyFilters(hotelsWithPrices, filters);

        // Sort by AI affordability score
        filtered = filtered.sort((a, b) => b.affordabilityScore - a.affordabilityScore);

        return { success: true, data: filtered };
    } catch (error) {
        console.error('Error fetching hotels:', error.message);
        return { success: false, error: 'Could not connect to hotel search service. Please check your connection and try again.' };
    }
};



/**
 * Transform OSM data to our hotel format
 */
const transformOSMToHotel = (element) => {
    const tags = element.tags || {};

    // Skip if no name
    if (!tags.name) return null;

    const lat = element.lat || (element.center && element.center.lat);
    const lon = element.lon || (element.center && element.center.lon);

    const image = element.tags.image || element.tags['image:url'] || getHotelImage(tags.tourism || 'hotel');

    return {
        id: element.id.toString(),
        name: tags.name,
        type: tags.tourism || 'hotel',
        location: {
            lat,
            lon,
            address: tags['addr:street']
                ? `${tags['addr:street']}${tags['addr:housenumber'] ? ' ' + tags['addr:housenumber'] : ''}`
                : null,
            city: tags['addr:city'] || null,
            postcode: tags['addr:postcode'] || null
        },
        contact: {
            phone: tags.phone || tags['contact:phone'] || null,
            website: tags.website || tags['contact:website'] || null,
            email: tags.email || tags['contact:email'] || null
        },
        amenities: extractAmenities(tags),
        stars: parseInt(tags.stars) || estimateStarsFromTags(tags),
        description: tags.description || null,
        image: image,
        rawTags: tags
    };
};

/**
 * Get fallback image for hotels
 */
const getHotelImage = (type) => {
    const images = {
        hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400',
        hostel: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400',
        guest_house: 'https://images.unsplash.com/photo-1587985064135-0366536eab42?auto=format&fit=crop&q=80&w=400',
        motel: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400',
        apartment: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400',
        default: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=400'
    };
    return images[type] || images.default;
};

/**
 * Extract amenities from OSM tags
 */
const extractAmenities = (tags) => {
    const amenities = [];

    if (tags.internet_access === 'yes' || tags.internet_access === 'wlan') amenities.push('wifi');
    if (tags.swimming_pool === 'yes') amenities.push('pool');
    if (tags.restaurant === 'yes') amenities.push('restaurant');
    if (tags.bar === 'yes') amenities.push('bar');
    if (tags.breakfast === 'yes') amenities.push('breakfast');
    if (tags.air_conditioning === 'yes') amenities.push('ac');
    if (tags.parking === 'yes') amenities.push('parking');
    if (tags.wheelchair === 'yes') amenities.push('wheelchair');

    return amenities;
};

/**
 * Estimate star rating from tags if not available
 */
const estimateStarsFromTags = (tags) => {
    const type = tags.tourism;

    if (type === 'hostel') return 2;
    if (type === 'guest_house') return 2;
    if (type === 'motel') return 2;

    // Default hotel stars based on amenities
    let score = 3;

    if (tags.swimming_pool === 'yes') score += 0.5;
    if (tags.restaurant === 'yes') score += 0.5;
    if (tags.spa === 'yes') score += 1;

    return Math.min(Math.round(score), 5);
};

/**
 * AI: Estimate hotel price based on location, stars, type
 */
const estimateHotelPrice = (hotel, groupSize = 1) => {
    const baseRates = {
        hostel: 800,
        guest_house: 1200,
        hotel: 2500,
        motel: 1500
    };

    // Base price by type
    let pricePerNight = baseRates[hotel.type] || 2500;

    // Adjust by stars
    const starMultiplier = {
        1: 0.5,
        2: 0.7,
        3: 1.0,
        4: 1.5,
        5: 2.5
    };

    pricePerNight *= starMultiplier[hotel.stars] || 1.0;

    // Adjust by amenities (premium amenities increase price)
    const premiumAmenities = ['pool', 'spa', 'restaurant', 'bar'];
    const amenitiesList = Array.isArray(hotel.amenities) ? hotel.amenities : [];
    const premiumCount = amenitiesList.filter(a => premiumAmenities.includes(a)).length;
    pricePerNight *= (1 + premiumCount * 0.15);

    // Calculate room sharing for groups
    const roomsNeeded = Math.ceil(groupSize / 2); // 2 people per room
    const totalPrice = pricePerNight * roomsNeeded;
    const pricePerPerson = totalPrice / groupSize;

    return {
        pricePerNight: Math.round(pricePerNight),
        totalPrice: Math.round(totalPrice),
        pricePerPerson: Math.round(pricePerPerson),
        roomsNeeded,
        estimatedPrice: true
    };
};

/**
 * AI: Calculate affordability score (0-100)
 */
export const calculateAffordabilityScore = (hotel, budgetPerNight, groupSize) => {
    if (!budgetPerNight || budgetPerNight === 0) return 50;

    const hotelCost = hotel.totalPrice || hotel.pricePerNight;
    const budgetRatio = budgetPerNight / hotelCost;

    let score = 0;

    if (budgetRatio >= 1.5) score = 100; // Well within budget
    else if (budgetRatio >= 1.2) score = 90;
    else if (budgetRatio >= 1.0) score = 80;
    else if (budgetRatio >= 0.9) score = 70;
    else if (budgetRatio >= 0.8) score = 60;
    else if (budgetRatio >= 0.7) score = 50;
    else if (budgetRatio >= 0.6) score = 40;
    else if (budgetRatio >= 0.5) score = 30;
    else score = 20;

    // Bonus for good value (more stars for similar price)
    if (hotel.stars >= 4 && budgetRatio >= 0.9) score += 5;
    if (hotel.amenities.length > 3) score += 5;

    return Math.min(Math.round(score), 100);
};

/**
 * Apply filters to hotel list
 */
export const applyFilters = (hotels, filters) => {
    let filtered = [...hotels];

    // Price range filter
    if (filters.minPrice) {
        filtered = filtered.filter(h => h.pricePerNight >= filters.minPrice);
    }
    if (filters.maxPrice) {
        filtered = filtered.filter(h => h.pricePerNight <= filters.maxPrice);
    }

    // Star rating filter
    if (filters.minStars) {
        filtered = filtered.filter(h => h.stars >= filters.minStars);
    }

    // Type filter
    if (filters.types && filters.types.length > 0) {
        filtered = filtered.filter(h => filters.types.includes(h.type));
    }

    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
        filtered = filtered.filter(h =>
            filters.amenities.every(a => h.amenities.includes(a))
        );
    }

    // Calculate affordability score for each
    if (filters.budget) {
        filtered = filtered.map(hotel => ({
            ...hotel,
            affordabilityScore: calculateAffordabilityScore(
                hotel,
                filters.budget,
                filters.groupSize || 1
            )
        }));

        // Filter out hotels that are way over budget (score < 30)
        if (filters.affordableOnly) {
            filtered = filtered.filter(h => h.affordabilityScore >= 30);
        }
    }

    return filtered;
};

/**
 * Get affordability badge
 */
export const getAffordabilityBadge = (score) => {
    if (score >= 80) return {
        label: 'Great Value',
        color: 'green',
        icon: '✓',
        bgClass: 'bg-green-100 dark:bg-green-900/30',
        textClass: 'text-green-700 dark:text-green-400',
        borderClass: 'border-green-300 dark:border-green-500/30'
    };
    if (score >= 60) return {
        label: 'Affordable',
        color: 'yellow',
        icon: '~',
        bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
        textClass: 'text-yellow-700 dark:text-yellow-400',
        borderClass: 'border-yellow-300 dark:border-yellow-500/30'
    };
    if (score >= 40) return {
        label: 'Budget Tight',
        color: 'orange',
        icon: '!',
        bgClass: 'bg-orange-100 dark:bg-orange-900/30',
        textClass: 'text-orange-700 dark:text-orange-400',
        borderClass: 'border-orange-300 dark:border-orange-500/30'
    };
    return {
        label: 'Over Budget',
        color: 'red',
        icon: '×',
        bgClass: 'bg-red-100 dark:bg-red-900/30',
        textClass: 'text-red-700 dark:text-red-400',
        borderClass: 'border-red-300 dark:border-red-500/30'
    };
};

/**
 * Get booking link (redirect to Booking.com search)
 */
export const getBookingLink = (hotel, checkIn, checkOut, guests) => {
    const hotelName = encodeURIComponent(hotel.name);
    const city = encodeURIComponent(hotel.location.city || '');

    return `https://www.booking.com/search.html?ss=${hotelName}+${city}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${guests}`;
};
