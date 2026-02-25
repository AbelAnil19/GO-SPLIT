import React from 'react';
import HotelSearch from '../hotels/HotelSearch';

const HotelsTab = ({ trip, groupSize, budget }) => {
    if (!trip) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">hotel</span>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">No destination selected</p>
                <p className="text-gray-500 text-sm">Select a destination from the Destinations tab to find hotels</p>
            </div>
        );
    }

    return (
        <HotelSearch
            destination={trip.title || trip.name}
            groupSize={groupSize || 1}
            budget={budget || null}
        />
    );
};

export default HotelsTab;
