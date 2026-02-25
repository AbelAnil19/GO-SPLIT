import React from 'react';

const MinimalToast = ({ open, onClose, message, type = 'default' }) => {
    if (!open) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-green-500',
                    icon: 'check_circle',
                    iconColor: 'text-white'
                };
            case 'error':
                return {
                    bg: 'bg-red-500',
                    icon: 'error',
                    iconColor: 'text-white'
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-500',
                    icon: 'warning',
                    iconColor: 'text-white'
                };
            case 'info':
                return {
                    bg: 'bg-blue-500',
                    icon: 'info',
                    iconColor: 'text-white'
                };
            default:
                return {
                    bg: 'bg-gray-500',
                    icon: 'notifications',
                    iconColor: 'text-white'
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in-up w-[90%] md:w-auto flex justify-center">
            <div className={`${styles.bg} text-white px-4 md:px-8 py-3 md:py-5 rounded-lg md:rounded-xl shadow-2xl flex items-center gap-2 md:gap-4 md:min-w-[500px] max-w-sm md:max-w-3xl w-full`}>
                <span className={`material-symbols-outlined ${styles.iconColor} text-lg md:text-2xl flex-shrink-0`}>
                    {styles.icon}
                </span>
                <p className="flex-1 font-medium text-xs md:text-sm">{message}</p>
                <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
                >
                    <span className="material-symbols-outlined text-base md:text-xl">close</span>
                </button>
            </div>
        </div>
    );
};

export default MinimalToast;
