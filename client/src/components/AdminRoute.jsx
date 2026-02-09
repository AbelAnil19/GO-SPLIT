import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../firebase/authContext';
import { getUserDocument } from '../firebase/firestore';

/**
 * Protected route component for admin-only pages
 * Checks if user is authenticated AND has admin privileges
 */
const AdminRoute = ({ children }) => {
    const { currentUser } = useAuth();
    const [isAdmin, setIsAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            try {
                const userData = await getUserDocument(currentUser.uid);
                setIsAdmin(userData?.isAdmin === true);
            } catch (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        checkAdminStatus();
    }, [currentUser]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0f172a] dark:to-[#1a1c23] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Not an admin
    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    // Admin - render children
    return children;
};

export default AdminRoute;
