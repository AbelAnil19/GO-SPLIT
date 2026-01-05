import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../firebase/authContext';
import { sendEmailVerification, checkIfEmailVerified } from '../firebase/auth';
import { useToast } from '../context/ToastContext';

const VerifyEmailPage = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [checking, setChecking] = useState(false);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        // If no user, redirect to login
        if (!currentUser) {
            navigate('/login');
            return;
        }

        // If already verified, redirect to dashboard
        if (currentUser.emailVerified) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    const handleCheckVerification = async () => {
        setChecking(true);
        try {
            // Reload the current user to get fresh data
            if (currentUser) {
                await currentUser.reload();
            }

            const isVerified = await checkIfEmailVerified();

            if (isVerified) {
                addToast('Email verified! Redirecting to dashboard...', 'success');
                // Small delay to show the success message
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            } else {
                addToast('Email not verified yet. Please check your inbox and click the link.', 'warning');
            }
        } catch (error) {
            console.error('Verification check error:', error);
            addToast('Error checking verification. Please try logging in again.', 'error');
        }
        setChecking(false);
    };

    const handleResendEmail = async () => {
        if (!currentUser) return;

        setResending(true);
        try {
            await sendEmailVerification(currentUser);
            addToast('Verification email sent! Check your inbox.', 'success');
        } catch (error) {
            if (error.code === 'auth/too-many-requests') {
                addToast('Too many requests. Please wait a moment.', 'error');
            } else {
                addToast('Failed to send email. Please try again.', 'error');
            }
        }
        setResending(false);
    };

    if (!currentUser) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
            <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-2xl w-full max-w-md mx-4">
                <div className="text-center mb-8">
                    <div className="size-20 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-600 text-4xl">mail</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
                    <p className="text-gray-600">
                        We sent a verification link to:
                    </p>
                    <p className="text-gray-800 font-semibold mt-2">
                        {currentUser.email}
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex gap-3">
                        <span className="material-symbols-outlined text-blue-600 text-xl">info</span>
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">Check your email</p>
                            <p>Click the verification link in your email to activate your account.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleCheckVerification}
                        disabled={checking}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {checking ? 'Checking...' : 'I\'ve Verified My Email'}
                    </button>

                    <button
                        onClick={handleResendEmail}
                        disabled={resending}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {resending ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                </div>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p className="mb-2">Didn't receive the email?</p>
                    <ul className="text-left space-y-1 text-xs bg-gray-50 p-3 rounded-lg">
                        <li>• Check your spam/junk folder</li>
                        <li>• Wait a few minutes for delivery</li>
                        <li>• Make sure {currentUser.email} is correct</li>
                    </ul>
                </div>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-gray-600 hover:text-gray-800 underline">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
