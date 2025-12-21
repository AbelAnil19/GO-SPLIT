import React from 'react';
import { useAuth } from '../firebase/authContext';
import { useNavigate, Link } from 'react-router-dom';
import { doSignOut } from '../firebase/auth';

const HomePage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await doSignOut();
        navigate('/login');
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)] text-white">
            <div className="glass-card p-10 rounded-3xl shadow-2xl w-full max-w-2xl text-center backdrop-blur-md bg-white/10 border border-white/20 relative">
                <Link to="/" className="absolute top-4 right-6 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </Link>
                <div className="relative inline-block mb-6">
                    {currentUser.photoURL ? (
                        <img
                            src={currentUser.photoURL}
                            alt="Profile"
                            className="w-32 h-32 rounded-full border-4 border-amber-400 mx-auto shadow-lg object-cover"
                        />
                    ) : (
                        <div className="w-32 h-32 rounded-full border-4 border-amber-400 mx-auto shadow-lg bg-gray-600 flex items-center justify-center text-4xl font-bold">
                            {currentUser.email?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </div>

                <h1 className="text-4xl font-bold mb-2">Welcome Back!</h1>
                <h2 className="text-2xl text-amber-400 mb-6 font-semibold">{currentUser.displayName || "User"}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left bg-black/20 p-6 rounded-2xl mb-8">
                    <div>
                        <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Email Address</p>
                        <p className="text-lg font-medium">{currentUser.email}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">User ID</p>
                        <p className="text-lg font-medium font-mono truncate">{currentUser.uid}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Account Status</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                        </span>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Last Login</p>
                        <p className="text-lg font-medium">{new Date(parseInt(currentUser.metadata.lastLoginAt)).toLocaleDateString()}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="bg-red-500/80 hover:bg-red-600/80 text-white font-bold py-3 px-8 rounded-full transition-all hover:scale-105 shadow-lg backdrop-blur-sm"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
};

export default HomePage;
