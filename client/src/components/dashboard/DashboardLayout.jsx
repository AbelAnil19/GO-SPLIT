import React, { useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase/authContext';
import { useToast } from '../../context/ToastContext';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import '../../styles/patterns.css';

const DashboardLayout = () => {
    const { currentUser, userLoggedIn } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const hasShownToast = useRef(false); // Track if we've shown the verification toast

    useEffect(() => {
        const checkVerification = async () => {
            // Redirect to login if not logged in
            if (!userLoggedIn) {
                navigate('/login');
                return;
            }

            if (!currentUser) return;

            // Check if email is verified (skip for Google users)
            const isGoogleUser = currentUser.providerData?.some(
                provider => provider.providerId === 'google.com'
            );

            // Optimization: If already verified, no need to reload!
            // This prevents "503 Service Unavailable" errors from spamming the API
            if (currentUser.emailVerified || isGoogleUser) {
                return;
            }

            // Reload user to get latest emailVerified status
            try {
                await currentUser.reload();
            } catch (error) {
                console.warn('⚠️ Skipping user reload due to network/service error:', error);
                // Continue execution - don't crash the app
            }

            if (!currentUser.emailVerified && !isGoogleUser) {
                // Only show toast once per mount
                if (!hasShownToast.current) {
                    addToast('Please verify your email to access the dashboard', 'warning');
                    hasShownToast.current = true;
                }
                navigate('/verify-email');
            }
        };

        checkVerification();
    }, [currentUser, userLoggedIn, navigate, addToast]);

    // Check verification status
    const isGoogleUser = currentUser?.providerData?.some(
        provider => provider.providerId === 'google.com'
    );
    const isVerified = currentUser?.emailVerified || isGoogleUser;

    // Don't render dashboard if not logged in or not verified
    if (!userLoggedIn || !isVerified) {
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-[#0a0f14] dark:via-[#0d191b] dark:to-[#0a0f14] overflow-hidden relative">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area with Pattern */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <DashboardHeader />

                {/* Page Content with Pattern Overlay */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto relative">
                    <div className="min-h-full p-8 noise-pattern">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
