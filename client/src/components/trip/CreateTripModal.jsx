import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';

const CreateTripModal = ({ isOpen, onClose, onSave, initialData }) => {
    const { t } = useTranslation();
    const { currencySymbol } = useCurrency();
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [budget, setBudget] = useState('');
    const [image, setImage] = useState('');
    const [fetchingImage, setFetchingImage] = useState(false);

    // Is this an edit of an existing trip?
    const isEditing = !!(initialData?.id);

    // Live validation errors
    const [errors, setErrors] = useState({
        title: '',
        startDate: '',
        endDate: '',
        budget: ''
    });

    useEffect(() => {
        if (!isOpen) return;

        if (initialData) {
            setTitle(initialData.title || '');
            setLocation(initialData.location || '');
            setImage(initialData.image || '');
            // Pre-fill dates and budget when editing
            setStartDate(initialData.startDate || '');
            setEndDate(initialData.endDate || '');
            setBudget(initialData.estimatedCost ? String(initialData.estimatedCost) : '');
        } else {
            // Reset everything for brand new custom destination
            setTitle('');
            setLocation('');
            setImage('');
            setStartDate('');
            setEndDate('');
            setBudget('');
        }
        setErrors({ title: '', startDate: '', endDate: '', budget: '' });
    }, [initialData, isOpen]);

    // Auto-fetch Wikipedia image when title changes (only if no image already set)
    useEffect(() => {
        if (!isOpen) return;
        if (image || !title || title.trim().length < 3) return;

        const timer = setTimeout(async () => {
            setFetchingImage(true);
            try {
                const response = await fetch(
                    `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(title.trim())}&origin=*`
                );
                const data = await response.json();
                const pages = data.query.pages;
                const pageId = Object.keys(pages)[0];
                if (pages[pageId]?.original?.source) {
                    setImage(pages[pageId].original.source);
                }
            } catch (error) {
                console.error('Error fetching preview image:', error);
            } finally {
                setFetchingImage(false);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [title, isOpen]);

    const handleSave = () => {
        if (!title || !startDate || !endDate) return;

        // Calculate duration in days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        const durationText = `${durationDays} Day${durationDays > 1 ? 's' : ''}`;

        const tripData = {
            // Preserve existing fields when editing (id, lat, lon, notes, isFavorite, etc.)
            ...(initialData || {}),
            title,
            location: location || title, // fallback location to title
            startDate,
            endDate,
            estimatedCost: Number(budget) || 0,
            duration: durationText,
            image: image || null,
            tags: initialData?.tags || ['Custom Trip'],
            status: 'planning',
            createdAt: initialData?.createdAt || new Date().toISOString()
        };

        onSave(tripData);
        onClose();
    };

    // Live validation handlers
    const handleTitleChange = (e) => {
        const value = e.target.value;
        setTitle(value);
        // Clear the image when title changes so a new one can be fetched
        if (!initialData?.image) {
            setImage('');
        }

        if (value && value.trim().length < 3) {
            setErrors(prev => ({ ...prev, title: t('createTripModal.tripNameError') }));
        } else {
            setErrors(prev => ({ ...prev, title: '' }));
        }
    };

    const handleStartDateChange = (e) => {
        const value = e.target.value;
        setStartDate(value);

        if (value) {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                setErrors(prev => ({ ...prev, startDate: t('createTripModal.errorPastStart') }));
            } else {
                setErrors(prev => ({ ...prev, startDate: '' }));
            }

            // Also check end date if it exists
            if (endDate && new Date(endDate) < selectedDate) {
                setErrors(prev => ({ ...prev, endDate: t('createTripModal.errorEndBeforeStart') }));
            } else if (endDate) {
                setErrors(prev => ({ ...prev, endDate: '' }));
            }
        }
    };

    const handleEndDateChange = (e) => {
        const value = e.target.value;
        setEndDate(value);

        if (value && startDate) {
            if (new Date(value) < new Date(startDate)) {
                setErrors(prev => ({ ...prev, endDate: t('createTripModal.errorEndBeforeStart') }));
            } else {
                setErrors(prev => ({ ...prev, endDate: '' }));
            }
        } else {
            setErrors(prev => ({ ...prev, endDate: '' }));
        }
    };

    const handleBudgetChange = (e) => {
        const value = e.target.value;

        // Strict input validation: prevent negative signs or non-numeric chars
        if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
            setBudget(value);

            // Check numeric value for validity message
            if (value && parseFloat(value) > 0) {
                setErrors(prev => ({ ...prev, budget: '' }));
            } else if (value && parseFloat(value) === 0) {
                setErrors(prev => ({ ...prev, budget: t('createTripModal.budgetError0') }));
            } else if (value.includes('.') && value.split('.')[1]?.length > 2) {
                setErrors(prev => ({ ...prev, budget: t('createTripModal.budgetErrorDecimals') }));
            } else {
                setErrors(prev => ({ ...prev, budget: '' }));
            }
        }

        // Skip setting budget if invalid char typed (effectively ignores keypress)
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
                            {fetchingImage ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                    <span className="text-white/80 text-xs">{t('createTripModal.fetchingImage')}</span>
                                </div>
                            ) : (
                                <span className="material-symbols-outlined text-6xl text-white">flight</span>
                            )}
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                        <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                            {isEditing ? t('createTripModal.editTrip') : t('createTripModal.planTrip')}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900 rounded-full text-gray-700 dark:text-white transition-all shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
                        title={t('createTripModal.cancel')}
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
                    {/* Trip Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('createTripModal.tripName')}</label>
                        <input
                            type="text"
                            value={title}
                            onChange={handleTitleChange}
                            className={`w-full rounded-lg border ${errors.title ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-white/10'} p-3 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all`}
                            placeholder={t('createTripModal.tripNamePlaceholder')}
                        />
                        {errors.title && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                                {errors.title}
                            </p>
                        )}
                        {!errors.title && title && title.trim().length >= 3 && (
                            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                                {t('createTripModal.validTripName')}
                            </p>
                        )}
                    </div>

                    {/* Location (for custom destinations) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('createTripModal.location')}</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">location_on</span>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 dark:border-white/10 p-3 pl-10 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                                placeholder={t('createTripModal.locationPlaceholder')}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{t('createTripModal.locationHint')}</p>
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('createTripModal.startDate')}</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={handleStartDateChange}
                                min={new Date().toISOString().split('T')[0]}
                                className={`w-full rounded-lg border ${errors.startDate ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-white/10'} p-3 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all`}
                            />
                            {errors.startDate && (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                                    {errors.startDate}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('createTripModal.endDate')}</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={handleEndDateChange}
                                min={startDate || new Date().toISOString().split('T')[0]}
                                className={`w-full rounded-lg border ${errors.endDate ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-white/10'} p-3 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all`}
                            />
                            {errors.endDate && (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                                    {errors.endDate}
                                </p>
                            )}
                            {!errors.endDate && endDate && startDate && new Date(endDate) >= new Date(startDate) && (
                                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                                    {t('createTripModal.validDateRange')}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Expected Budget */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('createTripModal.estimatedBudget')}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">{currencySymbol}</span>
                            <input
                                type="text"
                                value={budget}
                                onChange={handleBudgetChange}
                                className={`w-full rounded-lg border ${errors.budget ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-white/10'} p-3 pl-8 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all`}
                                placeholder="0.00"
                            />
                        </div>
                        {errors.budget && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                                {errors.budget}
                            </p>
                        )}
                        {!errors.budget && budget && parseFloat(budget) > 0 && (
                            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                                {t('createTripModal.validBudget')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-0 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-medium transition-colors"
                    >
                        {t('createTripModal.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title || !startDate || !endDate || (endDate && startDate && new Date(endDate) < new Date(startDate))}
                        className="px-6 py-2.5 rounded-xl bg-amber-400 text-black font-bold hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">{isEditing ? 'save' : 'add'}</span>
                        {isEditing ? t('createTripModal.saveChanges') : t('createTripModal.createTrip')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTripModal;
