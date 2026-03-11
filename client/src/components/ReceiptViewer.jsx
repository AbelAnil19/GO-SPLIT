import React, { useState } from 'react';

const ReceiptViewer = ({ receipt }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!receipt?.url) return null;

    return (
        <>
            {/* Thumbnail - No label (parent provides it) */}
            <div>
                <div
                    onClick={() => setIsModalOpen(true)}
                    className="relative group cursor-pointer"
                >
                    <img
                        src={receipt.url}
                        alt="Receipt"
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-white/10 group-hover:opacity-90 transition"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg">
                        <span className="text-white font-semibold flex items-center gap-2">
                            <span className="material-symbols-outlined">zoom_in</span>
                            Click to view
                        </span>
                    </div>
                </div>
            </div>

            {/* Full-screen Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8"
                    onClick={() => setIsModalOpen(false)}
                >
                    {/* Action Toolbar */}
                    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 sm:gap-4 z-10" onClick={(e) => e.stopPropagation()}>
                        <a
                            href={receipt.url}
                            download={receipt.name || 'receipt'}
                            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-lg border border-white/10 transition-all font-semibold text-sm sm:text-base shadow-lg"
                        >
                            <span className="material-symbols-outlined text-xl sm:text-2xl">download</span>
                            <span className="hidden sm:inline">Download</span>
                        </a>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-red-500/80 text-white hover:text-white rounded-full backdrop-blur-lg border border-white/10 transition-all shadow-lg"
                        >
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>

                    {/* Image Container */}
                    <div
                        className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center pt-14 sm:pt-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={receipt.url}
                            alt="Receipt full view"
                            className="max-w-full max-h-[85vh] sm:max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default ReceiptViewer;
