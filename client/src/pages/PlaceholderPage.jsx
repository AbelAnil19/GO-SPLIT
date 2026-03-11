import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const PlaceholderPage = () => {
    const location = useLocation();
    const title = location.pathname.split('/').pop().charAt(0).toUpperCase() + location.pathname.split('/').pop().slice(1);

    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                <span className="material-symbols-outlined text-4xl text-gray-500">construction</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{title} Coming Soon</h1>
            <p className="text-gray-400 max-w-md mb-8">
                This feature is currently under development. Check back later for updates!
            </p>
            <Link to="/dashboard" className="px-6 py-2 bg-amber-400 text-black font-bold rounded-xl hover:bg-amber-300 transition-colors">
                Back to Dashboard
            </Link>
        </div>
    );
};

export default PlaceholderPage;
