import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0d1015] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="relative z-10 text-center max-w-2xl px-6">
                {/* 404 Text with Floating Animation */}
                <div className="relative inline-block mb-4">
                    <h1 className="text-[180px] font-black leading-none select-none text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-200 dark:from-white dark:to-gray-800 opacity-20 dark:opacity-10 scale-150 transform transition-transform duration-1000">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-[100px] animate-bounce" style={{ animationDuration: '3s' }}>
                            🧑‍🚀
                        </div>
                    </div>
                </div>

                <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
                    Lost in Space?
                </h2>

                <p className="text-gray-600 dark:text-gray-400 mb-10 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
                    The page you are looking for has drifted away into the unknown universe. Let's get you back to safety! 🚀
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-white/20 transition-all transform hover:-translate-y-1"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-500 hover:to-orange-600 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group"
                    >
                        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">home</span>
                        Back to Dashboard
                    </button>
                </div>

                {/* Decorative Elements */}
                <div className="mt-16 flex justify-center gap-2 opacity-20">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-ping"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-ping" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-ping" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
