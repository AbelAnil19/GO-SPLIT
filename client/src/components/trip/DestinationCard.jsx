import React from 'react';

const DestinationCard = ({ destination, onFavorite, onViewDetails }) => {
    const getTagColor = (tag) => {
        switch (tag) {
            case 'Budget-Friendly':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'Premium':
                return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'Best Value':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
            {/* Image */}
            <div className="relative h-48 overflow-hidden">
                <img
                    src={destination.image}
                    alt={destination.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Tag Badge */}
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold border ${getTagColor(destination.tags[0])} backdrop-blur-md`}>
                    {destination.tags[0]}
                </div>
                {/* Favorite Button */}
                <button
                    onClick={() => onFavorite(destination.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                    <span className={`material-symbols-outlined text-xl ${destination.isFavorite ? 'text-red-500' : 'text-white'}`}>
                        {destination.isFavorite ? 'favorite' : 'favorite_border'}
                    </span>
                </button>
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Location */}
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-2">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span>{destination.location}</span>
                </div>

                {/* Title */}
                <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-3 line-clamp-1">
                    {destination.title}
                </h3>

                {/* Stats */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">EST. COST (3D)</p>
                        <p className="text-amber-500 dark:text-amber-400 font-bold text-xl">₹{destination.estimatedCost.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</p>
                        <p className="text-gray-900 dark:text-white text-sm font-medium">{destination.duration}</p>
                    </div>
                </div>

                {/* View Details Button */}
                <button
                    onClick={() => onViewDetails(destination)}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    View Details
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default DestinationCard;
