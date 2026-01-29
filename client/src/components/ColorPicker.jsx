import React, { useState } from 'react';

const THEME_COLORS = [
    { name: 'Amber', hex: '#F59E0B' },
    { name: 'Rose', hex: '#F43F5E' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Purple', hex: '#A855F7' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Cyan', hex: '#06B6D4' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Indigo', hex: '#6366F1' },
    { name: 'Teal', hex: '#14B8A6' }
];

const ColorPicker = ({ currentColor, onChange }) => {
    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color Theme</label>
            <div className="grid grid-cols-5 gap-3">
                {THEME_COLORS.map((color) => (
                    <button
                        key={color.hex}
                        onClick={() => onChange(color.hex)}
                        className={`group relative aspect-square rounded-xl transition-all hover:scale-110 ${currentColor === color.hex ? 'ring-4 ring-offset-2 dark:ring-offset-[#1a1c23] scale-110' : ''
                            }`}
                        style={{ backgroundColor: color.hex, ringColor: color.hex }}
                        title={color.name}
                    >
                        {currentColor === color.hex && (
                            <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-white text-2xl">
                                check
                            </span>
                        )}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {color.name}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ColorPicker;
