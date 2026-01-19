import React, { useState } from 'react';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';
import { updateUserDocument, getUserDocument, deleteAllUserExpenses, deleteAllCreatedGroups, updateUserAvatar } from '../firebase/firestore';
import AvatarPickerModal from '../components/AvatarPickerModal';

const SettingsPage = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [firstName, setFirstName] = useState(currentUser?.displayName?.split(' ')[0] || '');
    const [lastName, setLastName] = useState(currentUser?.displayName?.split(' ')[1] || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [phone, setPhone] = useState('');
    const [upiId, setUpiId] = useState('');
    const [currency, setCurrency] = useState('INR');
    const [language, setLanguage] = useState('en');
    const [notifExpense, setNotifExpense] = useState(true);
    const [notifSettlement, setNotifSettlement] = useState(true);
    const [notifMarketing, setNotifMarketing] = useState(false);
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
    const [userAvatar, setUserAvatar] = useState(currentUser?.photoURL || '');

    // Fetch user details from Firestore
    React.useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser?.uid) {
                try {
                    const userData = await getUserDocument(currentUser.uid);
                    if (userData) {
                        if (userData.phone) setPhone(userData.phone);
                        if (userData.upiId) setUpiId(userData.upiId);
                        if (userData.currency) setCurrency(userData.currency);
                        if (userData.language) setLanguage(userData.language);
                        if (userData.photoURL) setUserAvatar(userData.photoURL);
                    }
                } catch (error) {
                    console.error("Error fetching user settings:", error);
                }
            }
        };
        fetchUserData();
    }, [currentUser]);

    const handleSave = async () => {
        try {
            await updateUserDocument(currentUser.uid, {
                displayName: `${firstName} ${lastName}`.trim(),
                phone,
                upiId,
                currency,
                language,
                notifications: {
                    expense: notifExpense,
                    settlement: notifSettlement,
                    marketing: notifMarketing
                }
            });
            addToast('Settings saved successfully!', 'success');
        } catch (error) {
            console.error("Error saving settings:", error);
            addToast('Failed to save settings', 'error');
        }
    };

    const handleAvatarSave = async (newPhotoURL, avatarStyle) => {
        try {
            await updateUserAvatar(currentUser.uid, newPhotoURL, avatarStyle);
            setUserAvatar(newPhotoURL);
            addToast('Avatar updated successfully!', 'success');
        } catch (error) {
            console.error("Error updating avatar:", error);
            addToast('Failed to update avatar', 'error');
        }
    };

    const handleCancel = () => {
        addToast('Changes cancelled', 'info');
    };

    const [dangerModal, setDangerModal] = useState({ isOpen: false, type: null });
    const [confirmText, setConfirmText] = useState('');

    const handleConfirmDelete = async () => {
        if (confirmText !== 'DELETE') return;

        try {
            if (dangerModal.type === 'expenses') {
                await deleteAllUserExpenses(currentUser.uid);
                addToast('All your expenses have been deleted.', 'success');
            } else if (dangerModal.type === 'all') {
                await deleteAllUserExpenses(currentUser.uid);
                await deleteAllCreatedGroups(currentUser.uid);
                addToast('Your account has been reset.', 'success');
            }
            setDangerModal({ isOpen: false, type: null });
            setConfirmText('');
        } catch (error) {
            console.error(error);
            addToast('Failed to delete data.', 'error');
        }
    };

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-7xl mx-auto">
            {/* Page Heading */}
            <div className="flex flex-col gap-3">
                <h1 className="text-[#0d191b] dark:text-white text-4xl font-black tracking-tight">Settings</h1>
                <p className="text-[#5c6f73] dark:text-gray-400 text-base font-normal">Manage your profile details, currency preferences, and security settings.</p>
            </div>

            <div className="flex flex-col gap-6">
                {/* Profile Header Card */}
                <section className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-sm border border-gray-300 dark:border-white/10 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start justify-between">
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
                                <p className="text-[#5c6f73] dark:text-gray-400 text-sm mb-2">{currentUser?.email}</p>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400">
                                    Free Plan
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => addToast('Photo upload coming soon!', 'info')}
                            className="bg-white/10 hover:bg-white/20 text-[#0d191b] dark:text-white text-sm font-bold py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">upload</span>
                            Change Photo
                        </button>
                    </div>
                </section>

                {/* Personal Information */}
                <section className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-300 dark:border-white/10 overflow-hidden backdrop-blur-md">
                    <div className="px-6 py-5 border-b border-gray-300 dark:border-white/10">
                        <h3 className="text-lg font-bold text-[#0d191b] dark:text-white">Personal Information</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">First Name</label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-[#0d191b] dark:text-white px-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-gray-500"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">Last Name</label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-[#0d191b] dark:text-white px-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-gray-500"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">Email Address</label>
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
                                <label className="text-sm font-medium text-gray-300">Phone Number</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5c6f73] dark:text-gray-400 text-[20px]">phone</span>
                                    <input
                                        className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-[#0d191b] dark:text-white pl-10 pr-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-gray-500"
                                        placeholder="+1 (555) 000-0000"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">UPI ID (for payments)</label>
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
                < section className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-300 dark:border-white/10 overflow-hidden backdrop-blur-md" >
                    <div className="px-6 py-5 border-b border-gray-300 dark:border-white/10">
                        <h3 className="text-lg font-bold text-[#0d191b] dark:text-white">Regional Preferences</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">Default Currency</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white px-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all cursor-pointer"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                    >
                                        <option value="INR" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">INR (₹) - Indian Rupee</option>
                                        <option value="USD" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">USD ($) - United States Dollar</option>
                                        <option value="EUR" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">EUR (€) - Euro</option>
                                        <option value="GBP" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">GBP (£) - British Pound</option>
                                        <option value="JPY" className="bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white">JPY (¥) - Japanese Yen</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#5c6f73] dark:text-gray-400 pointer-events-none">expand_more</span>
                                </div>
                                <p className="text-xs text-gray-500">This will be the default currency for new expenses.</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">Language</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1a1c23] text-gray-900 dark:text-white px-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all cursor-pointer"
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
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
                < section className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-300 dark:border-white/10 overflow-hidden backdrop-blur-md" >
                    <div className="px-6 py-5 border-b border-gray-300 dark:border-white/10">
                        <h3 className="text-lg font-bold text-[#0d191b] dark:text-white">Notifications</h3>
                    </div>
                    <div className="p-6 flex flex-col gap-6">
                        {/* Toggle 1 */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-bold text-[#0d191b] dark:text-white">Expense Added</p>
                                <p className="text-sm text-[#5c6f73] dark:text-gray-400">Get notified when someone adds an expense to a group.</p>
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

                        {/* Toggle 2 */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-bold text-[#0d191b] dark:text-white">Settlement Reminders</p>
                                <p className="text-sm text-gray-400">Receive weekly summaries of outstanding balances.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={notifSettlement}
                                    onChange={(e) => setNotifSettlement(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                            </label>
                        </div>

                        {/* Toggle 3 */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-bold text-white">Marketing Emails</p>
                                <p className="text-sm text-gray-400">Receive news, updates, and offers from GoSplit.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={notifMarketing}
                                    onChange={(e) => setNotifMarketing(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                            </label>
                        </div>
                    </div>
                </section >

                {/* Danger Zone */}
                < section className="border border-red-500/20 bg-red-500/5 rounded-2xl overflow-hidden mt-4 backdrop-blur-md" >
                    <div className="px-6 py-5">
                        <h3 className="text-lg font-bold text-red-400">Danger Zone</h3>
                        <p className="text-sm text-gray-400 mt-1">Irreversible actions. Please be certain.</p>
                        <div className="mt-4 flex flex-wrap gap-3 justify-end">
                            <button
                                onClick={() => setDangerModal({ isOpen: true, type: 'expenses' })}
                                className="px-4 py-2 bg-white/5 border border-red-500/30 text-red-400 text-sm font-bold rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                                Delete All Expenses
                            </button>
                            <button
                                onClick={() => setDangerModal({ isOpen: true, type: 'all' })}
                                className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold rounded-lg hover:bg-red-500/20 transition-colors"
                            >
                                Reset Account
                            </button>
                        </div>
                    </div>
                </section >

                {/* Danger Modal */}
                {dangerModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDangerModal({ isOpen: false, type: null })}></div>
                        <div className="relative bg-[#1a1c23] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto flex items-center justify-center text-red-500 mb-4">
                                <span className="material-symbols-outlined text-3xl">warning</span>
                            </div>
                            <h2 className="text-xl font-bold text-white text-center mb-2">Are you sure?</h2>
                            <p className="text-gray-400 text-center text-sm mb-6">
                                {dangerModal.type === 'expenses'
                                    ? "This will permanently delete ALL expenses you have paid for. This cannot be undone."
                                    : "This will delete ALL your expenses and groups you created. This cannot be undone."}
                            </p>

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Type "DELETE" to confirm</label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    className="w-full bg-black/30 border border-red-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors font-mono"
                                    placeholder="DELETE"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDangerModal({ isOpen: false, type: null })}
                                    className="flex-1 px-4 py-2 text-gray-400 font-bold hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={confirmText !== 'DELETE'}
                                    className="flex-1 px-4 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Bar */}
                < div className="sticky bottom-4 z-40 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg flex justify-end gap-3" >
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2.5 rounded-lg font-bold text-sm text-white hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 rounded-lg bg-amber-400 text-black font-bold text-sm hover:bg-amber-300 shadow-md shadow-amber-900/20 transition-all transform active:scale-95"
                    >
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Avatar Picker Modal */}
            <AvatarPickerModal
                isOpen={isAvatarPickerOpen}
                currentPhotoURL={userAvatar || currentUser?.photoURL}
                userId={currentUser?.uid}
                onClose={() => setIsAvatarPickerOpen(false)}
                onSave={handleAvatarSave}
            />
        </div>
    );
};

export default SettingsPage;
