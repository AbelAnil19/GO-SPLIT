/**
 * Geoapify Places API Service
 * 3,000 Free requests per day - No Credit Card Required
 * Documentation: https://apidocs.geoapify.com/docs/places/
 */

const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;
const BASE_URL = 'https://api.geoapify.com/v2/places';

/**
 * Fetch nearby places from Geoapify
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 * @param {string} category GoSplit category (hotels, restaurants, attractions, parks, shopping, transport)
 * @param {number} radius Radius in meters (default 10km)
 */
export const fetchNearbyPlacesGeoapify = async (lat, lon, category = 'restaurants', radius = 10000) => {
    if (!API_KEY || API_KEY === 'YOUR_GEOAPIFY_API_KEY_HERE') {
        console.info('ℹ️ Geoapify API key missing. Please add it to your .env file to see real results.');
        return [];
    }

    try {
        // Ensure numbers and valid coordinate ranges
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        if (isNaN(latitude) || isNaN(longitude)) {
            console.error('Invalid coordinates passed to Geoapify:', { lat, lon });
            return [];
        }

        const categories = mapCategoryToGeoapify(category);
        const filter = `circle:${longitude},${latitude},${radius}`;
        const bias = `proximity:${longitude},${latitude}`;

        const params = new URLSearchParams({
            categories,
            filter,
            bias,
            limit: '10',
            apiKey: API_KEY
        });

        const url = `${BASE_URL}?${params.toString()}`;

        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Geoapify error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        return data.features.map(feature => {
            const props = feature.properties;
            const type = props.categories[0]?.split('.').pop() || 'place';

            return {
                id: props.place_id,
                name: props.name || props.street || 'Unknown Place',
                type: type,
                category: category,
                lat: props.lat,
                lon: props.lon,
                distance: Math.round((props.distance / 1000) * 10) / 10,
                address: props.formatted || 'Address not available',
                image: getUnsplashFallback(category, type),
                rating: props.rating || null,
                website: props.website || null
            };
        });

    } catch (error) {
        console.error('Geoapify Fetch Error:', error);
        return [];
    }
};

/**
 * Maps GoSplit categories to Geoapify hierarchical categories
 */
const mapCategoryToGeoapify = (category) => {
    const mapping = {
        hotels: 'accommodation.hotel,accommodation.hostel',
        restaurants: 'catering.restaurant,catering.cafe',
        attractions: 'entertainment.museum,entertainment.culture,tourism.attraction',
        parks: 'leisure.park,leisure.garden,natural.forest',
        shopping: 'commercial.shopping_mall,commercial.supermarket,commercial.clothing',
        transport: 'public_transport,airport'
    };
    return mapping[category] || 'catering.restaurant';
};

/**
 * Unsplash fallbacks for "Hybrid Strategy" (0 Photo Cost)
 */
const getUnsplashFallback = (category, type) => {
    const images = {
        transport: {
            railway: 'https://images.unsplash.com/photo-1515165592879-18497ba20783?auto=format&fit=crop&q=80&w=400',
            airport: 'https://images.unsplash.com/photo-1556388169-eb7db5f03800?auto=format&fit=crop&q=80&w=400',
            bus: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=400',
            default: 'https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?auto=format&fit=crop&q=80&w=400'
        },
        hotels: {
            hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400',
            hostel: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400',
            default: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=400'
        },
        restaurants: {
            restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400',
            cafe: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400',
            default: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=400'
        },
        attractions: {
            museum: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&q=80&w=400',
            attraction: 'https://images.unsplash.com/photo-1605649487215-476f06c25264?auto=format&fit=crop&q=80&w=400',
            default: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&q=80&w=400'
        }
    };

    const catImages = images[category] || images.attractions;
    return catImages[type] || catImages.default;
};
