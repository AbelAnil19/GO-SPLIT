// Itinerary Service - CRUD operations for trip itineraries
import { db } from '../firebase/firebaseConfig';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';

/**
 * Create a new itinerary for a group
 */
export const createItinerary = async (itineraryData) => {
    try {
        const itinerariesRef = collection(db, 'itineraries');
        const newItinerary = {
            ...itineraryData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            days: itineraryData.days || []
        };

        const docRef = await addDoc(itinerariesRef, newItinerary);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error creating itinerary:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get itinerary by ID
 */
export const getItinerary = async (itineraryId) => {
    try {
        const docRef = doc(db, 'itineraries', itineraryId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
        } else {
            return { success: false, error: 'Itinerary not found' };
        }
    } catch (error) {
        console.error('Error getting itinerary:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all itineraries for a group
 */
export const getGroupItineraries = async (groupId) => {
    try {
        const q = query(
            collection(db, 'itineraries'),
            where('groupId', '==', groupId)
        );

        const querySnapshot = await getDocs(q);
        const itineraries = [];

        querySnapshot.forEach((doc) => {
            itineraries.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: itineraries };
    } catch (error) {
        console.error('Error getting group itineraries:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update an itinerary
 */
export const updateItinerary = async (itineraryId, updates) => {
    try {
        const docRef = doc(db, 'itineraries', itineraryId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating itinerary:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete an itinerary
 */
export const deleteItinerary = async (itineraryId) => {
    try {
        const docRef = doc(db, 'itineraries', itineraryId);
        await deleteDoc(docRef);

        return { success: true };
    } catch (error) {
        console.error('Error deleting itinerary:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Add a day to the itinerary
 */
export const addDay = async (itineraryId, dayData) => {
    try {
        const result = await getItinerary(itineraryId);
        if (!result.success) return result;

        const itinerary = result.data;
        const newDays = [...(itinerary.days || []), dayData];

        await updateItinerary(itineraryId, { days: newDays });
        return { success: true };
    } catch (error) {
        console.error('Error adding day:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update a specific day
 */
export const updateDay = async (itineraryId, dayIndex, dayData) => {
    try {
        const result = await getItinerary(itineraryId);
        if (!result.success) return result;

        const itinerary = result.data;
        const newDays = [...itinerary.days];
        newDays[dayIndex] = { ...newDays[dayIndex], ...dayData };

        await updateItinerary(itineraryId, { days: newDays });
        return { success: true };
    } catch (error) {
        console.error('Error updating day:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Remove a day
 */
export const removeDay = async (itineraryId, dayIndex) => {
    try {
        const result = await getItinerary(itineraryId);
        if (!result.success) return result;

        const itinerary = result.data;
        const newDays = itinerary.days.filter((_, index) => index !== dayIndex);

        await updateItinerary(itineraryId, { days: newDays });
        return { success: true };
    } catch (error) {
        console.error('Error removing day:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Add activity to a specific day and time slot
 */
export const addActivity = async (itineraryId, dayIndex, timeSlot, activity) => {
    try {
        const result = await getItinerary(itineraryId);
        if (!result.success) return result;

        const itinerary = result.data;
        const newDays = [...itinerary.days];
        const day = newDays[dayIndex];

        if (!day.activities) {
            day.activities = [];
        }

        day.activities.push({
            ...activity,
            timeSlot,
            id: Date.now().toString()
        });

        // Recalculate budget used
        day.budgetUsed = day.activities.reduce((sum, act) => sum + (act.cost || 0), 0);

        await updateItinerary(itineraryId, { days: newDays });
        return { success: true };
    } catch (error) {
        console.error('Error adding activity:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Remove activity from a day
 */
export const removeActivity = async (itineraryId, dayIndex, activityId) => {
    try {
        const result = await getItinerary(itineraryId);
        if (!result.success) return result;

        const itinerary = result.data;
        const newDays = [...itinerary.days];
        const day = newDays[dayIndex];

        day.activities = day.activities.filter(act => act.id !== activityId);
        day.budgetUsed = day.activities.reduce((sum, act) => sum + (act.cost || 0), 0);

        await updateItinerary(itineraryId, { days: newDays });
        return { success: true };
    } catch (error) {
        console.error('Error removing activity:', error);
        return { success: false, error: error.message };
    }
};

/**
 * AI: Calculate budget breakdown recommendation
 */
export const calculateBudgetBreakdown = (totalBudget, days) => {
    // Typical spending distribution
    const distribution = {
        accommodation: 0.30,  // 30%
        food: 0.25,          // 25%
        activities: 0.30,    // 30%
        transportation: 0.15 // 15%
    };

    return {
        accommodation: Math.round(totalBudget * distribution.accommodation),
        food: Math.round(totalBudget * distribution.food),
        activities: Math.round(totalBudget * distribution.activities),
        transportation: Math.round(totalBudget * distribution.transportation),
        perDay: Math.round(totalBudget / days)
    };
};

/**
 * AI: Calculate affordability score for hotels/activities
 */
export const calculateAffordabilityScore = (itemPrice, budgetAllocated) => {
    if (budgetAllocated === 0) return 0;

    const ratio = (budgetAllocated / itemPrice) * 100;

    if (ratio >= 100) return 100; // Well within budget
    if (ratio >= 80) return 80;   // Affordable
    if (ratio >= 60) return 60;   // Tight but doable
    if (ratio >= 40) return 40;   // Over budget
    return 20;                     // Way over budget
};

/**
 * AI: Get recommendation text based on affordability score
 */
export const getAffordabilityRecommendation = (score) => {
    if (score >= 100) return { text: 'Excellent choice! Well within budget', color: 'green' };
    if (score >= 80) return { text: 'Good value for money', color: 'green' };
    if (score >= 60) return { text: 'Affordable, but tight', color: 'yellow' };
    if (score >= 40) return { text: 'Over budget - consider alternatives', color: 'orange' };
    return { text: 'Too expensive for current budget', color: 'red' };
};
