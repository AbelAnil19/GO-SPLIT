/**
 * Overpass API Service
 * Fetches nearby places from OpenStreetMap using Overpass API
 * 100% Free - No API keys required
 * Includes fallback mock data for reliability
 */

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
import { fetchNearbyPlacesGeoapify } from './geoapifyService';

/**
 * Calculate distance between two coordinates in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Build Overpass QL query for a specific category
 * Simplified for faster response times
 */
const buildQuery = (lat, lon, category, radius) => {
    const categoryQueries = {
        // Transport - simplified to just major nodes
        transport: `
            [out:json][timeout:12];
            (
                node["railway"="station"](around:${radius},${lat},${lon});
                node["aeroway"="aerodrome"](around:${radius},${lat},${lon});
            );
            out body 15;
        `,

        // Hotels & Accommodation
        hotels: `
            [out:json][timeout:12];
            (
                node["tourism"="hotel"](around:${radius},${lat},${lon});
                node["tourism"="hostel"](around:${radius},${lat},${lon});
            );
            out body 15;
        `,

        // Restaurants & Food
        restaurants: `
            [out:json][timeout:12];
            (
                node["amenity"="restaurant"](around:${radius},${lat},${lon});
                node["amenity"="cafe"](around:${radius},${lat},${lon});
            );
            out body 15;
        `,

        // Attractions & Activities
        attractions: `
            [out:json][timeout:12];
            (
                node["tourism"="museum"](around:${radius},${lat},${lon});
                node["tourism"="attraction"](around:${radius},${lat},${lon});
            );
            out body 15;
        `
    };

    return categoryQueries[category] || categoryQueries.restaurants;
};

/**
 * Fetch nearby places from Overpass API with fallback
 */
export const fetchNearbyPlaces = async (lat, lon, category = 'restaurants', radius = 10000) => {
    try {
        const query = buildQuery(lat, lon, category, radius);

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(OVERPASS_API_URL, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 429) {
                console.info('ℹ️ Overpass API is temporarily busy. Seamlessly switching to backup service (Geoapify)...');
                // Small delay to be polite to the server
                await new Promise(resolve => setTimeout(resolve, 2000));
                return await fetchNearbyPlacesGeoapify(lat, lon, category, radius);
            }
            console.info(`ℹ️ Overpass API returned ${response.status}. Attempting backup discovery...`);
            return await fetchNearbyPlacesGeoapify(lat, lon, category, radius);
        }

        const data = await response.json();

        // Transform results
        const places = (data.elements || [])
            .filter(el => el.tags && el.tags.name)
            .map(el => {
                const distance = calculateDistance(lat, lon, el.lat, el.lon);

                return {
                    id: el.id,
                    name: el.tags.name,
                    type: getPlaceType(el.tags),
                    category: category,
                    cuisine: el.tags.cuisine || null,
                    stars: el.tags.stars || null,
                    description: el.tags.description || null,
                    lat: el.lat,
                    lon: el.lon,
                    distance: Math.round(distance * 10) / 10,
                    address: buildAddress(el.tags)
                };
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 30);

        return places;

    } catch (error) {
        if (error.name === 'AbortError') {
            console.info('ℹ️ Overpass API timeout, trying Geoapify fallback...');
        } else {
            console.info('ℹ️ Overpass API error, trying Geoapify fallback:', error.message);
        }

        return await fetchNearbyPlacesGeoapify(lat, lon, category, radius);
    }
};

/**
 * Determine the specific type of place
 */
const getPlaceType = (tags) => {
    if (tags.amenity) return tags.amenity;
    if (tags.tourism) return tags.tourism;
    if (tags.railway) return 'railway_station';
    if (tags.aeroway) return 'airport';
    if (tags.historic) return 'historic';
    if (tags.leisure) return tags.leisure;
    if (tags.shop) return 'shopping';
    return 'unknown';
};

/**
 * Build address from tags
 */
const buildAddress = (tags) => {
    const parts = [];
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
};

/**
 * Get icon for place type
 */
export const getPlaceIcon = (type) => {
    const iconMap = {
        'restaurant': 'restaurant',
        'cafe': 'local_cafe',
        'fast_food': 'fastfood',
        'hotel': 'hotel',
        'hostel': 'night_shelter',
        'guest_house': 'home',
        'apartment': 'apartment',
        'railway_station': 'train',
        'airport': 'flight',
        'bus_station': 'directions_bus',
        'subway': 'subway',
        'museum': 'museum',
        'attraction': 'attractions',
        'historic': 'castle',
        'park': 'park',
        'shopping': 'shopping_bag',
        'theatre': 'theater_comedy'
    };
    return iconMap[type] || 'place';
};

export default {
    fetchNearbyPlaces,
    getPlaceIcon
};
