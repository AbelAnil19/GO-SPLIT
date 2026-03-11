import React, { useState, useEffect } from 'react';
import * as OTPAuth from 'otpauth';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../firebase/authContext';
import { useToast } from '../../context/ToastContext';
import { getUserDocument, enableUser2FA, disableUser2FA } from '../../firebase/firestore';
import TwoFactorPromptModal from '../TwoFactorPromptModal';
import { useTwoFactor } from '../../context/TwoFactorContext';

const TwoFactorSettings = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const { clearTrust } = useTwoFactor();

    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [setupStep, setSetupStep] = useState('idle'); // 'idle', 'generating', 'verify'
    const [secret, setSecret] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isDisablePromptOpen, setIsDisablePromptOpen] = useState(false);

    // Fetch user 2FA status on mount
    useEffect(() => {
        const fetchStatus = async () => {
            if (currentUser) {
                try {
                    const userData = await getUserDocument(currentUser.uid);
                    setIs2FAEnabled(userData?.is2FAEnabled || false);
                } catch (error) {
                    console.error('Error fetching 2FA status:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchStatus();
    }, [currentUser]);

    // Step 1: Generate Secret & QR Code
    const handleStartSetup = () => {
        setSetupStep('generating');

        // Generate a cryptographically secure base32 secret using otpauth
        const generatedSecret = new OTPAuth.Secret({ size: 20 }).base32;
        setSecret(generatedSecret);

        // Generate the otpauth:// URI for the QR code using OTPAuth class
        const totpObj = new OTPAuth.TOTP({
            issuer: "GoSplit",
            label: currentUser.email,
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: generatedSecret
        });

        const otpauth = totpObj.toString(); // Generates the correct otpauth:// URI automatically

        setQrCodeUrl(otpauth);
        setSetupStep('verify');
    };

    // Step 2: Verify the code they typed to confirm it works
    const handleVerifyAndEnable = async (e) => {
        e.preventDefault();

        if (verificationCode.length !== 6) {
            addToast('Code must be 6 digits', 'error');
            return;
        }

        setIsVerifying(true);

        try {
            if (!secret) {
                addToast('Missing secret. Please restart setup.', 'error');
                setIsVerifying(false);
                return;
            }

            // Verify the token against our generated secret
            // Providing a small window of leniency (1 step before/after) is standard
            let isValid = false;
            try {
                const totpObj = new OTPAuth.TOTP({
                    issuer: "GoSplit",
                    label: currentUser.email,
                    algorithm: "SHA1",
                    digits: 6,
                    period: 30,
                    secret: secret
                });

                // validate returns the delta in steps, or null if invalid
                const delta = totpObj.validate({ token: verificationCode, window: 1 });
                isValid = delta !== null;
            } catch (err) {
                console.warn('otpauth verify error:', err.message);
                isValid = false;
            }

            if (isValid) {
                // Success! Save it to Firestore
                await enableUser2FA(currentUser.uid, secret);
                setIs2FAEnabled(true);
                setSetupStep('idle');
                setSecret('');
                setVerificationCode('');
                addToast('Two-Factor Authentication Enabled! Your write operations are now protected.', 'success');
            } else {
                addToast('Invalid verification code. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error enabling 2FA:', error);
            addToast('Failed to enable 2FA. Please try again.', 'error');
        } finally {
            setIsVerifying(false);
        }
    };

    // Disable 2FA
    const handleDisable = () => {
        setIsDisablePromptOpen(true);
    };

    const executeDisable = async () => {
        setLoading(true);
        try {
            await disableUser2FA(currentUser.uid);
            clearTrust(); // Clear the session trust so they need to re-verify next time
            setIs2FAEnabled(false);
            addToast('Two-Factor Authentication Disabled.', 'success');
            setIsDisablePromptOpen(false);
        } catch (error) {
            console.error('Error disabling 2FA:', error);
            addToast('Failed to disable 2FA.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white/50 dark:bg-white/5 rounded-2xl p-6 border border-gray-200 dark:border-white/10 flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400"></div>
            </div>
        );
    }

    return (
        <section className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-300 dark:border-white/10 overflow-hidden backdrop-blur-md">
            <div className="px-6 py-5 border-b border-gray-300 dark:border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-500">
                    <span className="material-symbols-outlined text-[20px]">security</span>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-[#0d191b] dark:text-white">Two-Factor Authentication (2FA)</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your monetary transactions.</p>
                </div>
            </div>
            <div className="p-6">

                {/* STATUS VIEW */}
                {is2FAEnabled ? (
                    <div className="space-y-4">
                        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                            <span className="material-symbols-outlined text-green-500 text-2xl">check_circle</span>
                            <div>
                                <h3 className="font-semibold text-green-800 dark:text-green-400">2FA is Currently Enabled</h3>
                                <p className="text-sm text-green-600 dark:text-green-300">Your write operations (adding expenses, settling up) are protected by a 2FA shield.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleDisable}
                            className="px-6 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold rounded-xl transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">gpp_bad</span>
                            Disable 2FA
                        </button>
                    </div>
                ) : setupStep === 'idle' ? (
                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3">
                            <span className="material-symbols-outlined text-gray-400 text-2xl">shield_locked</span>
                            <div>
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">2FA is Not Enabled</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Enable Two-Factor Authentication using an app like Google Authenticator or Authy to prevent unauthorized tampering of your group expenses.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleStartSetup}
                            className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-xl transition-colors w-full sm:w-auto"
                        >
                            Set Up 2FA
                        </button>
                    </div>
                ) : null}

                {/* SETUP WIZARD (Verify Step) */}
                {setupStep === 'verify' && (
                    <div className="mt-6 border-t border-gray-200 dark:border-white/10 pt-6 animate-fade-in">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Setup Instructions</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Column 1: QR & Manual Key */}
                            <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 w-full text-center mb-4">
                                    1. Scan this QR code with your Authenticator App
                                </p>

                                <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                                    <QRCodeSVG value={qrCodeUrl} size={150} level="M" includeMargin={false} />
                                </div>

                                <div className="w-full">
                                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-2">Or enter manual setup key:</p>
                                    <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-center tracking-widest font-mono text-sm dark:text-amber-400 select-all border border-gray-200 dark:border-gray-700">
                                        {secret}
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Code Verification */}
                            <div className="flex flex-col justify-center">
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 w-full mb-4">
                                    2. Enter the 6-digit code generated by your app
                                </p>

                                <form onSubmit={handleVerifyAndEnable} className="space-y-4">
                                    <div>
                                        <input
                                            type="text"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                            placeholder="000000"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent text-center text-2xl tracking-[0.5em] font-mono"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSetupStep('idle')}
                                            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isVerifying || verificationCode.length !== 6}
                                            className="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isVerifying ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                                            ) : (
                                                'Verify & Save'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                <TwoFactorPromptModal
                    isOpen={isDisablePromptOpen}
                    onClose={() => setIsDisablePromptOpen(false)}
                    onVerifySuccess={executeDisable}
                    actionName="Disabling 2FA"
                />
            </div>
        </section>
    );
};

export default TwoFactorSettings;
