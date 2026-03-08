import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { doDeleteUser } from '../firebase/auth';
import { updateUserDocument, getUserDocument, softDeleteUserAccount, updateUserAvatar, deleteAllUserExpenses, deleteAllCreatedGroups } from '../firebase/firestore';
import ConfirmationModal from '../components/ConfirmationModal';
import BalanceCheckModal from '../components/BalanceCheckModal';
import AvatarPickerModal from '../components/AvatarPickerModal';
import MinimalToast from '../components/ui/MinimalToast';
import { useCurrency } from '../context/CurrencyContext';
import TwoFactorSettings from '../components/settings/TwoFactorSettings';

const SettingsPage = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { setCurrency: updateGlobalCurrency } = useCurrency();

    const [firstName, setFirstName] = useState(currentUser?.displayName?.split(' ')[0] || '');
    const [lastName, setLastName] = useState(currentUser?.displayName?.split(' ')[1] || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [countryCode, setCountryCode] = useState('+91'); // Default to India
    const [phone, setPhone] = useState('');
    const [upiId, setUpiId] = useState('');
    const [currency, setCurrency] = useState('INR');
    const [language, setLanguage] = useState('en');
    const [notifExpense, setNotifExpense] = useState(true);
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
    const [userAvatar, setUserAvatar] = useState(currentUser?.photoURL || '');
    const [dangerModal, setDangerModal] = useState({ isOpen: false, type: null });
    const [confirmText, setConfirmText] = useState('');

    // Live validation errors
    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        phone: ''
    });

    // Country codes for dropdown with exact phone lengths
    const countryCodes = [
        { code: '+1', country: 'US/CA', flag: '🇺🇸', length: 10 },
        { code: '+44', country: 'UK', flag: '🇬🇧', length: 10 },
        { code: '+91', country: 'India', flag: '🇮🇳', length: 10 },
        { code: '+61', country: 'Australia', flag: '🇦🇺', length: 9 },
        { code: '+81', country: 'Japan', flag: '🇯🇵', length: 10 },
        { code: '+86', country: 'China', flag: '🇨🇳', length: 11 },
        { code: '+49', country: 'Germany', flag: '🇩🇪', length: 10 },
        { code: '+33', country: 'France', flag: '🇫🇷', length: 9 },
        { code: '+971', country: 'UAE', flag: '🇦🇪', length: 9 },
        { code: '+65', country: 'Singapore', flag: '🇸🇬', length: 8 },
    ];

    // MinimalToast state for validation
    const [validationToast, setValidationToast] = useState({
        open: false,
        message: '',
        type: 'error'
    });

    const showValidationError = (message) => {
        setValidationToast({
            open: true,
            message,
            type: 'error'
        });
        setTimeout(() => {
            setValidationToast(prev => ({ ...prev, open: false }));
        }, 3000);
    };

    // Phase 2: Balance check modal state
    const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
    const [isFinalDeleteModalOpen, setIsFinalDeleteModalOpen] = useState(false);

    // Fetch user details from Firestore and sync i18n
    React.useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser?.uid) {
                try {
                    const userData = await getUserDocument(currentUser.uid);
                    if (userData) {
                        if (userData.phone) setPhone(userData.phone);
                        if (userData.upiId) setUpiId(userData.upiId);
                        if (userData.currency) setCurrency(userData.currency);
                        if (userData.language) {
                            setLanguage(userData.language);
                            i18n.changeLanguage(userData.language);
                        } else if (i18n.language) {
                            setLanguage(i18n.language.split('-')[0]);
                        }
                        if (userData.photoURL) setUserAvatar(userData.photoURL);

                        if (userData.notifExpense !== undefined) setNotifExpense(userData.notifExpense);
                    }
                } catch (error) {
                    console.error("Error fetching user settings:", error);
                }
            }
        };
        fetchUserData();
    }, [currentUser]);

    // Handle language change
    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setLanguage(newLang);
    };

    // Live validation handlers
    const handleFirstNameChange = (e) => {
        const value = e.target.value;
        setFirstName(value);

        // Validate name (letters and spaces only)
        if (value && !/^[a-zA-Z\s]*$/.test(value)) {
            setErrors(prev => ({ ...prev, firstName: 'Name can only contain letters and spaces' }));
        } else if (value && value.trim().length < 2) {
            setErrors(prev => ({ ...prev, firstName: 'Minimum 2 characters required' }));
        } else {
            setErrors(prev => ({ ...prev, firstName: '' }));
        }
    };

    const handleLastNameChange = (e) => {
        const value = e.target.value;
        setLastName(value);

        // Validate name (letters and spaces only)
        if (value && !/^[a-zA-Z\s]*$/.test(value)) {
            setErrors(prev => ({ ...prev, lastName: 'Name can only contain letters and spaces' }));
        } else {
            setErrors(prev => ({ ...prev, lastName: '' }));
        }
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;

        // Only allow digits
        const cleanValue = value.replace(/\D/g, '');
        setPhone(cleanValue);

        // Live validation
        if (cleanValue && !/^\d+$/.test(cleanValue)) {
            setErrors(prev => ({ ...prev, phone: 'Phone number must contain only digits' }));
        } else if (cleanValue) {
            const selectedCountry = countryCodes.find(c => c.code === countryCode);
            const requiredLength = selectedCountry?.length || 10;

            if (cleanValue.length < requiredLength) {
                setErrors(prev => ({ ...prev, phone: `Phone number must be ${requiredLength} digits` }));
            } else if (cleanValue.length > requiredLength) {
                setErrors(prev => ({ ...prev, phone: `Phone number must be exactly ${requiredLength} digits` }));
            } else {
                setErrors(prev => ({ ...prev, phone: '' }));
            }
        } else {
            setErrors(prev => ({ ...prev, phone: '' }));
        }
    };

    const handleSave = async () => {
        // Validation
        if (!firstName || firstName.trim().length < 2) {
            showValidationError('First name must be at least 2 characters');
            return;
        }

        if (phone) {
            // Remove spaces and special characters for validation
            const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

            // Check if it contains only digits
            if (!/^\d+$/.test(cleanPhone)) {
                showValidationError('Phone number must contain only digits');
                return;
            }

            // Get the selected country's required length
            const selectedCountry = countryCodes.find(c => c.code === countryCode);
            const requiredLength = selectedCountry?.length || 10;

            // Check exact length for the selected country
            if (cleanPhone.length !== requiredLength) {
                showValidationError(`${selectedCountry?.country || 'This country'} phone numbers must be exactly ${requiredLength} digits`);
                return;
            }
        }

        if (upiId && !upiId.includes('@')) {
            showValidationError('Please enter a valid UPI ID (e.g., username@upi)');
            return;
        }

        try {
            const fullName = `${firstName.trim()} ${lastName.trim()} `;
            const defaultCurrency = currency || 'INR';
            const defaultLanguage = language || 'en';

            await updateUserDocument(currentUser.uid, {
                displayName: fullName,
                phone,
                upiId,
                currency: defaultCurrency,
                language: defaultLanguage,
                notifExpense,
            });

            // If expense notifications were just turned on, ask browser for permission
            if (notifExpense && Notification.permission === 'default') {
                Notification.requestPermission();
            }

            // Update global currency context
            updateGlobalCurrency(defaultCurrency);

            // Update language
            i18n.changeLanguage(defaultLanguage);

            addToast('Settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            addToast('Failed to save settings', 'error');
        }
    };

    const handleAvatarSave = async (newPhotoURL, avatarStyle) => {
        try {
            await updateUserAvatar(currentUser.uid, newPhotoURL, avatarStyle);
            setUserAvatar(newPhotoURL);
            addToast(t('common.success'), 'success');
        } catch (error) {
            console.error("Error updating avatar:", error);
            addToast(t('common.error'), 'error');
        }
    };

    const handleCancel = () => {
        addToast(t('common.cancel'), 'info');
    };

    const handleConfirmDelete = async () => {
        if (confirmText !== 'DELETE') return;

        try {
            if (dangerModal.type === 'expenses') {
                await deleteAllUserExpenses(currentUser.uid);
                addToast(t('common.success'), 'success');
            } else if (dangerModal.type === 'all') {
                await deleteAllUserExpenses(currentUser.uid);
                await deleteAllCreatedGroups(currentUser.uid);
                addToast(t('common.success'), 'success');
            } else if (dangerModal.type === 'account') {
                // Soft delete user data (preserves history, transfers groups)
                await softDeleteUserAccount(currentUser.uid);

                // Then delete the Firebase Auth account (signs out)
                await doDeleteUser();
                addToast(t('common.success'), 'success');
                // Small delay to allow toast to show, then redirect
                setTimeout(() => {
                    navigate('/login');
                }, 500);
                return; // Exit early to prevent modal close
            }
            setDangerModal({ isOpen: false, type: null });
            setConfirmText('');
        } catch (error) {
            console.error(error);
            // Ignore permission errors after account deletion (expected behavior)
            if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
                navigate('/login');
                return;
            }
            if (error.code === 'auth/requires-recent-login') {
                addToast(t('common.error'), 'error');
            } else {
                addToast(t('common.error'), 'error');
            }
        }
    };

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-7xl mx-auto">
            {/* Page Heading */}
            <div className="flex flex-col gap-3">
                <h1 className="text-[#0d191b] dark:text-white text-4xl font-black tracking-tight">{t('settings.title')}</h1>
                <p className="text-[#5c6f73] dark:text-gray-400 text-base font-normal">{t('settings.subtitle')}</p>
            </div>

            <div className="flex flex-col gap-6">
                {/* Profile Header Card */}
                <section className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-sm border border-gray-300 dark:border-white/10 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                        <div className="flex flex-col sm:flex-row gap-5 items-center">
                            <div
                                className="relative group cursor-pointer"
                                onClick={() => setIsAvatarPickerOpen(true)}
                            >
                                {(userAvatar || currentUser?.photoURL) ? (
                                    <div
                                        className="bg-center bg-no-repeat bg-cover rounded-full h-24 w-24 ring-4 ring-amber-400"
                                        style={{ backgroundImage: `url('${userAvatar || currentUser.photoURL}')` }}
                                    ></div>
                                ) : (
                                    <div className="rounded-full h-24 w-24 ring-4 ring-amber-400 bg-amber-500/20 flex items-center justify-center text-3xl font-bold text-amber-400">
                                        {currentUser?.displayName?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-white">edit</span>
                                </div>
                            </div>
                            <div className="text-center sm:text-left">
                                <h2 className="text-[#0d191b] dark:text-white text-2xl font-bold">{currentUser?.displayName || 'User'}</h2>
                                <p className="text-[#5c6f73] dark:text-gray-400 text-sm">{currentUser?.email}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TWO FACTOR AUTHENTICATION SECTION */}
                <TwoFactorSettings />

                {/* Personal Information */}
                <section className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-300 dark:border-white/10 overflow-hidden backdrop-blur-md">
                    <div className="px-6 py-5 border-b border-gray-300 dark:border-white/10">
                        <h3 className="text-lg font-bold text-[#0d191b] dark:text-white">{t('settings.personalInfo')}</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">{t('settings.firstName')}</label>
                                <input
                                    className={`w-full rounded-lg border ${errors.firstName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-white/10'} bg-white dark:bg-white/5 text-[#0d191b] dark:text-white px-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-gray-500`}
                                    type="text"
                                    value={firstName}
                                    onChange={handleFirstNameChange}
                                />
                                {errors.firstName && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                                        {errors.firstName}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">{t('settings.lastName')}</label>
                                <input
                                    className={`w-full rounded-lg border ${errors.lastName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-white/10'} bg-white dark:bg-white/5 text-[#0d191b] dark:text-white px-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-gray-500`}
                                    type="text"
                                    value={lastName}
                                    onChange={handleLastNameChange}
                                />
                                {errors.lastName && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                                        {errors.lastName}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">{t('settings.email')}</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5c6f73] dark:text-gray-400 text-[20px]">mail</span>
                                    <input
                                        className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-[#0d191b] dark:text-white pl-10 pr-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-gray-500"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">{t('settings.phone')}</label>
                                <div className="flex gap-2">
                                    {/* Country Code Dropdown */}
                                    <div className="relative w-32">
                                        <select
                                            className="w-full appearance-none rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-[#0d191b] dark:text-white px-3 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all cursor-pointer text-sm"
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                        >
                                            {countryCodes.map((item) => (
                                                <option key={item.code} value={item.code} className="bg-white dark:bg-[#1a1c23]">
                                                    {item.flag} {item.code}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#5c6f73] dark:text-gray-400 pointer-events-none text-[18px]">expand_more</span>
                                    </div>
                                    {/* Phone Number Input */}
                                    <div className="relative flex-1">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5c6f73] dark:text-gray-400 text-[20px]">phone</span>
                                        <input
                                            className={`w-full rounded-lg border ${errors.phone ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-white/10'} bg-white dark:bg-white/5 text-[#0d191b] dark:text-white pl-10 pr-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-gray-500`}
                                            placeholder="1234567890"
                                            type="tel"
                                            value={phone}
                                            onChange={handlePhoneChange}
                                            maxLength={countryCodes.find(c => c.code === countryCode)?.length || 11}
                                        />
                                    </div>
                                </div>
                                {errors.phone && (
                                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                                        {errors.phone}
                                    </p>
                                )}
                                {!errors.phone && phone && (
                                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                                        Valid phone number
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">{t('settings.upi')}</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5c6f73] dark:text-gray-400 text-[20px]">account_balance_wallet</span>
                                    <input
                                        className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-[#0d191b] dark:text-white pl-10 pr-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-gray-500"
                                        placeholder="username@upi"
                                        type="text"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Regional Preferences */}
                <section className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-300 dark:border-white/10 overflow-hidden backdrop-blur-md">
                    <div className="px-6 py-5 border-b border-gray-300 dark:border-white/10">
                        <h3 className="text-lg font-bold text-[#0d191b] dark:text-white">{t('settings.regional')}</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">{t('settings.currency')}</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white px-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all cursor-pointer"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                    >
                                        <option value="INR" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">₹ INR - Indian Rupee</option>
                                        <option value="USD" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">$ USD - US Dollar</option>
                                        <option value="EUR" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">€ EUR - Euro</option>
                                        <option value="GBP" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">£ GBP - British Pound</option>
                                        <option value="JPY" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">¥ JPY - Japanese Yen</option>
                                        <option value="AUD" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">$ AUD - Australian Dollar</option>
                                        <option value="CAD" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">$ CAD - Canadian Dollar</option>
                                        <option value="SGD" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">$ SGD - Singapore Dollar</option>
                                        <option value="AED" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">د.إ AED - UAE Dirham</option>
                                        <option value="CNY" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">¥ CNY - Chinese Yuan</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#5c6f73] dark:text-gray-400 pointer-events-none">expand_more</span>
                                </div>
                                <p className="text-xs text-gray-500">{t('settings.currencyHelp')}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">{t('settings.language')}</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white px-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all cursor-pointer"
                                        value={language}
                                        onChange={handleLanguageChange}
                                    >
                                        <option value="en" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">English (US)</option>
                                        <option value="es" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">Spanish</option>
                                        <option value="fr" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">French</option>
                                        <option value="de" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">German</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#5c6f73] dark:text-gray-400 pointer-events-none">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section >

                {/* Notifications */}
                <section className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-300 dark:border-white/10 overflow-hidden backdrop-blur-md">
                    <div className="px-6 py-5 border-b border-gray-300 dark:border-white/10">
                        <h3 className="text-lg font-bold text-[#0d191b] dark:text-white">{t('settings.notifications')}</h3>
                    </div>
                    <div className="p-6 flex flex-col gap-6">
                        {/* Toggle 1 */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-bold text-[#0d191b] dark:text-white">{t('settings.notifExpense')}</p>
                                <p className="text-sm text-[#5c6f73] dark:text-gray-400">{t('settings.notifExpenseDesc')}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={notifExpense}
                                    onChange={(e) => setNotifExpense(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                            </label>
                        </div>

                    </div>
                </section>

                {/* Danger Zone */}
                <section className="border border-red-500/20 bg-red-500/5 dark:bg-red-500/5 rounded-2xl overflow-hidden mt-4 backdrop-blur-md">
                    <div className="px-6 py-5">
                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400">{t('settings.dangerZone')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('settings.dangerZoneDesc')}</p>
                        <div className="mt-4 flex flex-wrap gap-3 justify-end">
                            <button
                                onClick={() => setDangerModal({ isOpen: true, type: 'expenses' })}
                                className="px-4 py-2 bg-white dark:bg-white/5 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                                {t('settings.deleteExpenses')}
                            </button>
                            <button
                                onClick={() => setDangerModal({ isOpen: true, type: 'all' })}
                                className="px-4 py-2 bg-red-50 dark:bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                            >
                                {t('settings.resetAccount')}
                            </button>
                            <button
                                onClick={() => setIsBalanceModalOpen(true)}
                                className="px-4 py-2 bg-red-600 border-2 border-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                                title="Check your balance before deletion"
                            >
                                {t('settings.deleteAccount')}
                            </button>
                        </div>
                    </div>
                </section >

                {/* Danger Modal */}
                {
                    dangerModal.isOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDangerModal({ isOpen: false, type: null })}></div>
                            <div className="relative bg-white dark:bg-[#1a1c23] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                                <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto flex items-center justify-center text-red-500 mb-4">
                                    <span className="material-symbols-outlined text-3xl">warning</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">{t('common.confirm')}?</h2>
                                <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-6">
                                    {dangerModal.type === 'expenses'
                                        ? "This will permanently delete ALL expenses you have paid for. This cannot be undone."
                                        : dangerModal.type === 'account'
                                            ? "⚠️ This will PERMANENTLY DELETE your account, including all expenses, groups, and data. You will be logged out and cannot recover this account. This action is IRREVERSIBLE."
                                            : "This will delete ALL your expenses and groups you created. This cannot be undone."}
                                </p>

                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-500 uppercase mb-2">Type "DELETE" to confirm</label>
                                    <input
                                        type="text"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        className="w-full bg-gray-100 dark:bg-black/30 border border-red-500/30 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors font-mono"
                                        placeholder="DELETE"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDangerModal({ isOpen: false, type: null })}
                                        className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 font-bold hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleConfirmDelete}
                                        disabled={confirmText !== 'DELETE'}
                                        className="flex-1 px-4 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {t('common.delete')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Action Bar */}
                < div className="sticky bottom-4 z-40 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg flex justify-end gap-3" >
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2.5 rounded-lg font-bold text-sm text-white hover:bg-white/10 transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 rounded-lg bg-amber-400 text-black font-bold text-sm hover:bg-amber-300 shadow-md shadow-amber-900/20 transition-all transform active:scale-95"
                    >
                        {t('common.save')}
                    </button>
                </div>
            </div >

            {/* Phase 2: Balance Check Modal (NEW - Non-breaking) */}
            <BalanceCheckModal
                isOpen={isBalanceModalOpen}
                userId={currentUser?.uid}
                onClose={() => setIsBalanceModalOpen(false)}
                onProceedToDelete={() => setDangerModal({ isOpen: true, type: 'account' })}
            />

            {/* Avatar Picker Modal */}
            < AvatarPickerModal
                isOpen={isAvatarPickerOpen}
                currentPhotoURL={userAvatar || currentUser?.photoURL}
                userId={currentUser?.uid}
                onClose={() => setIsAvatarPickerOpen(false)}
                onSave={handleAvatarSave}
            />

            {/* Validation Toast */}
            <MinimalToast
                open={validationToast.open}
                onClose={() => setValidationToast(prev => ({ ...prev, open: false }))}
                message={validationToast.message}
                type={validationToast.type}
            />
        </div>
    );
};

export default SettingsPage;
