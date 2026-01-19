import React, { useState } from 'react';
import { AVATAR_STYLES, getAvatarUrl, getRandomSeed, getStyleFromUrl } from '../utils/avatarUtils';

const AvatarPickerModal = ({ isOpen, currentPhotoURL, userId, onClose, onSave }) => {
    const currentStyle = getStyleFromUrl(currentPhotoURL);
    const [selectedStyle, setSelectedStyle] = useState(currentStyle);
    const [seed, setSeed] = useState(userId);
    const [previewUrl, setPreviewUrl] = useState(currentPhotoURL);

    const handleStyleSelect = (styleId) => {
        setSelectedStyle(styleId);
        const newUrl = getAvatarUrl(styleId, seed);
        setPreviewUrl(newUrl);
    };

    const handleRandomize = () => {
        const newSeed = getRandomSeed();
        setSeed(newSeed);
        const newUrl = getAvatarUrl(selectedStyle, newSeed);
        setPreviewUrl(newUrl);
    };

    const handleSave = () => {
        onSave(previewUrl, selectedStyle);
        onClose();
    };

    const handleCancel = () => {
        // Reset to current values
        setSelectedStyle(currentStyle);
        setSeed(userId);
        setPreviewUrl(currentPhotoURL);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1a1c23] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-2xl mx-4 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-white/10">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Your Avatar</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select a style and personalize your profile picture</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Preview */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-amber-400 shadow-lg mb-4">
                            <img
                                src={previewUrl}
                                alt="Avatar preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            onClick={handleRandomize}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-900 dark:text-white font-medium"
                        >
                            <span className="material-symbols-outlined text-xl">refresh</span>
                            Randomize
                        </button>
                    </div>

                    {/* Style Selection */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {AVATAR_STYLES.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => handleStyleSelect(style.id)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${selectedStyle === style.id
                                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-400/10'
                                        : 'border-gray-200 dark:border-white/10 hover:border-amber-400/50 bg-white dark:bg-white/5'
                                    }`}
                            >
                                <span className="text-4xl">{style.emoji}</span>
                                <span className="font-semibold text-sm text-gray-900 dark:text-white">{style.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 text-center">{style.description}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 rounded-lg bg-amber-400 text-black font-semibold hover:bg-amber-500 transition-colors shadow-md"
                    >
                        Save Avatar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarPickerModal;
