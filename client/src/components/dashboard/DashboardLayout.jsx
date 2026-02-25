import React, { useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase/authContext';
import { useToast } from '../../context/ToastContext';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import AIInsightsBubble from '../ai/AIInsightsBubble';
import '../../styles/patterns.css';

const DashboardLayout = () => {
    const { currentUser, userLoggedIn } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const hasShownToast = useRef(false); // Track if we've shown the verification toast
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - HIDDEN ON DESKTOP, SLIDE-IN ON MOBILE */}
            <div className={`
                fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
                transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:block
            `}>
                <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
            </div>

            {/* Main Content Area with Pattern */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <DashboardHeader
                    onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />

                {/* Page Content with Pattern Overlay */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto relative">
                    <div className="min-h-full p-4 md:p-6 lg:p-8 noise-pattern">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* AI Insights Chat Bubble */}
            <AIInsightsBubble />
        </div>
    );
};

export default DashboardLayout;
