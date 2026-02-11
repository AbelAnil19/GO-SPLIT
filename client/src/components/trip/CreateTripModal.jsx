import React, { useState, useEffect } from 'react';

const CreateTripModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [budget, setBudget] = useState('');
    const [image, setImage] = useState('');

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || `Trip to ${initialData.location}`);
            setImage(initialData.image || '');
            setStartDate('');
            setEndDate('');
            setBudget('');
        }
    }, [initialData]);

    const handleSave = () => {
        if (!title || !startDate || !endDate) return;

        // Calculate duration in days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        const durationText = `${durationDays} Day${durationDays > 1 ? 's' : ''}`;

        onSave({
            ...initialData,
            title,
            startDate,
            endDate,
            estimatedCost: Number(budget) || 0,
            duration: durationText,
            image,
            status: 'planning',
            createdAt: new Date().toISOString()
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1a1c23] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header Image */}
                <div className="h-40 bg-gray-200 relative overflow-hidden">
                    {image ? (
                        <img src={image} alt="Trip cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600">
                            <span className="material-symbols-outlined text-6xl text-white">flight</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                        <h2 className="text-2xl font-bold text-white drop-shadow-lg">Plan Your Trip</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900 rounded-full text-gray-700 dark:text-white transition-all shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
                        title="Close"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 flex flex-col gap-4">
                    {/* Trip Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trip Name</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-white/10 p-3 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. Summer Vacation"
                        />
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full rounded-lg border border-gray-300 dark:border-white/10 p-3 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate || new Date().toISOString().split('T')[0]}
                                className="w-full rounded-lg border border-gray-300 dark:border-white/10 p-3 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                            />
                            {endDate && startDate && new Date(endDate) < new Date(startDate) && (
                                <p className="text-red-500 text-xs mt-1">End date must be after start date</p>
                            )}
                        </div>
                    </div>

                    {/* Expected Budget */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Budget</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 dark:border-white/10 p-3 pl-8 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-0 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title || !startDate || !endDate || (endDate && startDate && new Date(endDate) < new Date(startDate))}
                        className="px-6 py-2.5 rounded-xl bg-amber-400 text-black font-bold hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform active:scale-95"
                    >
                        Create Trip
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTripModal;
