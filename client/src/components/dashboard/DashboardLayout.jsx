import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase/authContext';
import { useToast } from '../../context/ToastContext';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

const DashboardLayout = () => {
    const { currentUser, userLoggedIn } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const checkVerification = async () => {
            // Redirect to login if not logged in
            if (!userLoggedIn) {
                navigate('/login');
                return;
            }

            if (!currentUser) return;

            // Reload user to get latest emailVerified status
            try {
                await currentUser.reload();
            } catch (error) {
                console.error('Error reloading user:', error);
            }

            // Check if email is verified (skip for Google users)
            const isGoogleUser = currentUser.providerData?.some(
                provider => provider.providerId === 'google.com'
            );

            if (!currentUser.emailVerified && !isGoogleUser) {
                addToast('Please verify your email to access the dashboard', 'warning');
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
        <div className="h-screen flex bg-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 relative overflow-hidden transition-colors duration-300">
            {/* Background effects - removed for light mode, keep for dark */}
            <div className="absolute inset-0 dark:bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.05),transparent_50%)]"></div>
            <div className="absolute inset-0 dark:bg-[radial-gradient(circle_at_70%_80%,rgba(251,191,36,0.03),transparent_50%)]"></div>

            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                <DashboardHeader />
                <main className="flex-1 overflow-y-auto px-8 py-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
