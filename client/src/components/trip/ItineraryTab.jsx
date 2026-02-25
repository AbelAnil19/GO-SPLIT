import React from 'react';
import ItineraryBuilder from '../itinerary/ItineraryBuilder';

const ItineraryTab = ({ groupId, groupData, savedTrips, activeTrip }) => {
    if (!groupId) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">event_note</span>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">No group selected</p>
                <p className="text-gray-500 text-sm">Select a group to create and manage trip itineraries</p>
            </div>
        );
    }

    return (
        <ItineraryBuilder
            groupId={groupId}
            groupData={groupData}
            savedTrips={savedTrips || []}
            activeTrip={activeTrip}
        />
    );
};

export default ItineraryTab;
