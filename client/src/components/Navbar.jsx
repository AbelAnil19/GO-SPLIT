import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../firebase/authContext';
import { doSignOut } from '../firebase/auth';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { userLoggedIn, currentUser } = useAuth();
    const navigate = useNavigate();

    return (
        <nav className="sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0">
                            <img className="h-10 w-auto" src="/src/assets/logo.png" alt="GoSplit" />
                        </Link>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link to="/" className="text-white hover:bg-white/20 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                                <Link to="/" className="text-gray-300 hover:bg-white/20 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Features</Link>
                                <Link to="/" className="text-gray-300 hover:bg-white/20 hover:text-white px-3 py-2 rounded-md text-sm font-medium">About</Link>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6">
                            {userLoggedIn ? (
                                <div className="flex items-center gap-4">
                                    <Link to="/home" className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors">
                                        {currentUser?.photoURL ? (
                                            <img src={currentUser.photoURL} alt="User" className="w-8 h-8 rounded-full border border-white/30" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold border border-white/30">
                                                {currentUser?.email?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium">{currentUser?.displayName || 'User'}</span>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <Link to="/login" className="text-gray-200 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Log In</Link>
                                    <Link to="/register" className="ml-3 text-[#0f172a] bg-white hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">Sign Up</Link>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link to="/" className="text-white block px-3 py-2 rounded-md text-base font-medium">Home</Link>
                        {userLoggedIn ? (
                            <Link to="/home" className="text-white block px-3 py-2 rounded-md text-base font-medium">Profile</Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Log In</Link>
                                <Link to="/register" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Sign Up</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
