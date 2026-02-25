import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';

const DestinationCard = ({ destination, onFavorite, onViewDetails, onDelete, onPlanTrip, isActivePlan }) => {
    const { formatAmount } = useCurrency();
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
        <div className={`bg-gradient-to-br from-white/20 to-white/15 dark:from-white/[0.04] dark:to-white/[0.02] backdrop-blur-[2px] rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-md dark:shadow-none group ${isActivePlan ? 'border-amber-400 shadow-amber-400/20 scale-[1.01]' : 'border-gray-200 dark:border-white/10 hover:border-amber-400/50 hover:shadow-xl hover:scale-[1.02]'}`}>
            {/* Image */}
            <div className="relative h-48 overflow-hidden">
                {destination.image ? (
                    <img
                        src={destination.image}
                        alt={destination.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <span className="material-symbols-outlined text-6xl text-white/80">flight</span>
                    </div>
                )}
                {/* Tag Badge */}
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold border ${getTagColor(destination.tags?.[0])} backdrop-blur-md`}>
                    {destination.tags?.[0] || 'Custom Trip'}
                </div>
                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-2">
                    {/* Delete Button */}
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(destination.id); }}
                            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-red-600/80 transition-colors"
                            title="Delete trip"
                        >
                            <span className="material-symbols-outlined text-xl text-white">delete</span>
                        </button>
                    )}
                    {/* Favorite Button */}
                    <button
                        onClick={() => onFavorite(destination.id)}
                        className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                        <span className={`material-symbols-outlined text-xl ${destination.isFavorite ? 'text-red-500' : 'text-white'}`}>
                            {destination.isFavorite ? 'favorite' : 'favorite_border'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Location */}
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-2">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span className="truncate">{destination.location || destination.title}</span>
                </div>

                {/* Title */}
                <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-3 line-clamp-1">
                    {destination.title}
                </h3>

                {/* Stats */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">EST. COST</p>
                        <p className="text-amber-500 dark:text-amber-400 font-bold text-xl">{formatAmount(destination.estimatedCost || 0)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</p>
                        <p className="text-gray-900 dark:text-white text-sm font-medium">{destination.duration || 'N/A'}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onViewDetails(destination)}
                        className="flex-1 py-3 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">info</span>
                        Details
                    </button>
                    {onPlanTrip && (
                        <button
                            onClick={() => onPlanTrip(destination)}
                            className={`flex-1 py-3 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${isActivePlan
                                ? 'bg-green-500 text-white cursor-default'
                                : 'bg-amber-400 hover:bg-amber-500 text-black'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">
                                {isActivePlan ? 'check_circle' : 'explore'}
                            </span>
                            {isActivePlan ? 'Active' : 'Plan Trip'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DestinationCard;
