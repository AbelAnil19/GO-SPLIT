import React, { useState } from 'react';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';

const SettingsPage = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [firstName, setFirstName] = useState(currentUser?.displayName?.split(' ')[0] || '');
    const [lastName, setLastName] = useState(currentUser?.displayName?.split(' ')[1] || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [phone, setPhone] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [language, setLanguage] = useState('en');
    const [notifExpense, setNotifExpense] = useState(true);
    const [notifSettlement, setNotifSettlement] = useState(true);
    const [notifMarketing, setNotifMarketing] = useState(false);

    const handleSave = () => {
        addToast('Settings saved successfully!', 'success');
    };

    const handleCancel = () => {
        addToast('Changes cancelled', 'info');
    };

    const handleDeleteAccount = () => {
        addToast('This feature requires additional confirmation', 'warning');
    };

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-7xl mx-auto">
            {/* Page Heading */}
            <div className="flex flex-col gap-3">
                <h1 className="text-white text-4xl font-black tracking-tight">Settings</h1>
                <p className="text-gray-400 text-base font-normal">Manage your profile details, currency preferences, and security settings.</p>
            </div>

            <div className="flex flex-col gap-6">
                {/* Profile Header Card */}
                <section className="bg-white/5 rounded-2xl p-6 shadow-sm border border-white/10 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start justify-between">
                        <div className="flex flex-col sm:flex-row gap-5 items-center">
                            <div className="relative group cursor-pointer">
                                {currentUser?.photoURL ? (
                                    <div
                                        className="bg-center bg-no-repeat bg-cover rounded-full h-24 w-24 ring-4 ring-[#0f172a]"
                                        style={{ backgroundImage: `url('${currentUser.photoURL}')` }}
                                    ></div>
                                ) : (
                                    <div className="rounded-full h-24 w-24 ring-4 ring-[#0f172a] bg-amber-500/20 flex items-center justify-center text-3xl font-bold text-amber-400">
                                        {currentUser?.displayName?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-white">edit</span>
                                </div>
                            </div>
                            <div className="text-center sm:text-left">
                                <h2 className="text-white text-2xl font-bold">{currentUser?.displayName || 'User'}</h2>
                                <p className="text-gray-400 text-sm mb-2">{currentUser?.email}</p>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400">
                                    Free Plan
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => addToast('Photo upload coming soon!', 'info')}
                            className="bg-white/10 hover:bg-white/20 text-white text-sm font-bold py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">upload</span>
                            Change Photo
                        </button>
                    </div>
                </section>

                {/* Personal Information */}
                <section className="bg-white/5 rounded-2xl shadow-sm border border-white/10 overflow-hidden backdrop-blur-md">
                    <div className="px-6 py-5 border-b border-white/10">
                        <h3 className="text-lg font-bold text-white">Personal Information</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">First Name</label>
                                <input
                                    className="w-full rounded-lg border border-white/10 bg-white/5 text-white px-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-gray-500"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">Last Name</label>
                                <input
                                    className="w-full rounded-lg border border-white/10 bg-white/5 text-white px-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-gray-500"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">Email Address</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">mail</span>
                                    <input
                                        className="w-full rounded-lg border border-white/10 bg-white/5 text-white pl-10 pr-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-gray-500"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">Phone Number</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">phone</span>
                                    <input
                                        className="w-full rounded-lg border border-white/10 bg-white/5 text-white pl-10 pr-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-gray-500"
                                        placeholder="+1 (555) 000-0000"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Regional Preferences */}
                <section className="bg-white/5 rounded-2xl shadow-sm border border-white/10 overflow-hidden backdrop-blur-md">
                    <div className="px-6 py-5 border-b border-white/10">
                        <h3 className="text-lg font-bold text-white">Regional Preferences</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">Default Currency</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none rounded-lg border border-white/10 bg-white/5 text-white px-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all cursor-pointer"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                    >
                                        <option value="USD">USD ($) - United States Dollar</option>
                                        <option value="EUR">EUR (€) - Euro</option>
                                        <option value="GBP">GBP (£) - British Pound</option>
                                        <option value="JPY">JPY (¥) - Japanese Yen</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                                </div>
                                <p className="text-xs text-gray-500">This will be the default currency for new expenses.</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">Language</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none rounded-lg border border-white/10 bg-white/5 text-white px-4 py-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all cursor-pointer"
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                    >
                                        <option value="en">English (US)</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                        <option value="de">German</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Notifications */}
                <section className="bg-white/5 rounded-2xl shadow-sm border border-white/10 overflow-hidden backdrop-blur-md">
                    <div className="px-6 py-5 border-b border-white/10">
                        <h3 className="text-lg font-bold text-white">Notifications</h3>
                    </div>
                    <div className="p-6 flex flex-col gap-6">
                        {/* Toggle 1 */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-bold text-white">Expense Added</p>
                                <p className="text-sm text-gray-400">Get notified when someone adds an expense to a group.</p>
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
                                <p className="text-sm font-bold text-white">Settlement Reminders</p>
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
                </section>

                {/* Danger Zone */}
                <section className="border border-red-500/20 bg-red-500/5 rounded-2xl overflow-hidden mt-4 backdrop-blur-md">
                    <div className="px-6 py-5">
                        <h3 className="text-lg font-bold text-red-400">Danger Zone</h3>
                        <p className="text-sm text-gray-400 mt-1">Once you delete your account, there is no going back. Please be certain.</p>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleDeleteAccount}
                                className="px-4 py-2 bg-white/5 border border-red-500/30 text-red-400 text-sm font-bold rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </section>

                {/* Action Bar */}
                <div className="sticky bottom-4 z-40 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg flex justify-end gap-3">
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
        </div>
    );
};

export default SettingsPage;
