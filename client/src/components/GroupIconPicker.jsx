import React, { useState } from 'react';

const GROUP_ICONS = [
    { category: 'Money', icons: ['💰', '💵', '💳', '🏦', '💸', '🪙'] },
    { category: 'Travel', icons: ['✈️', '🏖️', '🗺️', '🧳', '🚗', '🏔️', '🎒', '🛩️'] },
    { category: 'Food', icons: ['🍕', '🍔', '🍜', '🍱', '🍻', '☕', '🍰', '🥗'] },
    { category: 'Party', icons: ['🎉', '🎊', '🥳', '🎈', '🍾', '🎁', '🎪', '🎭'] },
    { category: 'Home', icons: ['🏠', '🏡', '🛋️', '🔑', '🚪', '🏘️', '🏢'] },
    { category: 'Work', icons: ['💼', '🏢', '💻', '📊', '📈', '🖥️', '⚙️', '🔧'] },
    { category: 'Sports', icons: ['⚽', '🏀', '🏈', '⛳', '🎾', '🏐', '🎱', '🎯'] },
    { category: 'Fun', icons: ['🎮', '🎬', '🎸', '🎨', '📚', '🎤', '🎲', '🧩'] },
    { category: 'Other', icons: ['👥', '🌟', '❤️', '🔥', '⭐', '💎', '🎯', '📌'] }
];

const GroupIconPicker = ({ currentIcon, onSelect, onClose }) => {
    const [selectedCategory, setSelectedCategory] = useState('Money');
    const [tempIcon, setTempIcon] = useState(currentIcon);

    const handleConfirm = () => {
        onSelect(tempIcon);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative bg-white dark:bg-[#1a1c23] rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Group Icon</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select an emoji that represents your group</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                {/* Preview */}
                <div className="mb-6 flex items-center gap-4 p-4 bg-gray-100 dark:bg-white/5 rounded-xl">
                    <span className="text-6xl">{tempIcon}</span>
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">This will be your group icon</p>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {GROUP_ICONS.map((cat) => (
                        <button
                            key={cat.category}
                            onClick={() => setSelectedCategory(cat.category)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === cat.category
                                ? 'bg-amber-400 text-gray-900'
                                : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20'
                                }`}
                        >
                            {cat.category}
                        </button>
                    ))}
                </div>

                {/* Icons Grid */}
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 mb-6 max-h-64 overflow-y-auto p-2">
                    {GROUP_ICONS.find(c => c.category === selectedCategory)?.icons.map((icon, idx) => (
                        <button
                            key={idx}
                            onClick={() => setTempIcon(icon)}
                            className={`aspect-square rounded-lg text-3xl hover:bg-gray-200 dark:hover:bg-white/20 transition-all flex items-center justify-center ${tempIcon === icon ? 'bg-amber-400/20 ring-2 ring-amber-400' : 'bg-gray-100 dark:bg-white/5'
                                }`}
                        >
                            {icon}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-xl transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupIconPicker;
