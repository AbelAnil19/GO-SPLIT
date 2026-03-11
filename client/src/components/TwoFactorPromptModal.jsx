import React, { useState, useEffect } from 'react';
import * as OTPAuth from 'otpauth';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../firebase/authContext';
import { useToast } from '../context/ToastContext';
import { getUserDocument } from '../firebase/firestore';
import { useTwoFactor } from '../context/TwoFactorContext';

const TwoFactorPromptModal = ({ isOpen, onClose, onVerifySuccess, actionName = "this action" }) => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const { addToast } = useToast();

    const { isTrusted, markVerified } = useTwoFactor();

    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // If the session is already trusted, skip the modal and directly run the action
    useEffect(() => {
        if (isOpen && isTrusted()) {
            onVerifySuccess();
        }
    }, [isOpen]);

    if (!isOpen) return null;
    // Also return null if trusted (onVerifySuccess already called in useEffect)
    if (isTrusted()) return null;

    const handleVerify = async (e) => {
        e.preventDefault();

        if (verificationCode.length !== 6) {
            addToast('Code must be 6 digits', 'error');
            return;
        }

        setIsVerifying(true);

        try {
            // 1. Fetch user's stored secret from Firestore
            const userData = await getUserDocument(currentUser.uid);
            const savedSecret = userData?.twoFactorSecret;

            if (!savedSecret) {
                addToast('2FA secret key missing. Please re-setup 2FA in settings.', 'error');
                setIsVerifying(false);
                return;
            }

            // 2. Verify code using otpauth
            let isValid = false;
            try {
                const totpObj = new OTPAuth.TOTP({
                    issuer: "GoSplit",
                    label: currentUser.email, // using email as label to match generation
                    algorithm: "SHA1",
                    digits: 6,
                    period: 30,
                    secret: savedSecret
                });

                const delta = totpObj.validate({ token: verificationCode, window: 1 });
                isValid = delta !== null;
            } catch (err) {
                console.warn('otpauth verify error:', err.message);
                isValid = false;
            }

            if (isValid) {
                // Mark session as trusted for the next 30 minutes
                markVerified();
                // Return success to the parent component so it can proceed with the protected action
                addToast('✅ 2FA Verified — session trusted for 30 minutes', 'success');
                onVerifySuccess();
                // Clear state for next time
                setVerificationCode('');
            } else {
                addToast('Invalid verification code. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error verifying 2FA:', error);
            addToast('Verification failed. Try again.', 'error');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-h-screen">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="relative bg-white dark:bg-[#1a1c23] w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden animate-scale-in border border-gray-100 dark:border-white/10 flex flex-col max-h-[90vh]">
                <div className="px-6 py-6 border-b border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-amber-400/10 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-4xl text-amber-500">lock_open</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Two-Factor Authentication</h2>
                    <p className="text-sm text-gray-500 mt-2">
                        Please enter the 6-digit code from your Authenticator app to authorize <strong>{actionName}</strong>.
                    </p>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                placeholder="000 000"
                                className="w-full px-4 py-4 rounded-xl border-2 border-amber-400/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-amber-400/20 focus:border-amber-400 text-center text-3xl tracking-[0.5em] font-mono shadow-inner outline-none transition-all"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isVerifying || verificationCode.length !== 6}
                                className="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg shadow-amber-400/20"
                            >
                                {isVerifying ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-black/20 border-t-black"></div>
                                ) : (
                                    'Verify'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TwoFactorPromptModal;
