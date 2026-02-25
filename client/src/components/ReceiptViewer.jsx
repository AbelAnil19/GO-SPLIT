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
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh] w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute -top-12 right-0 text-white hover:text-amber-400 transition flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-3xl">close</span>
                            <span className="font-semibold">Close</span>
                        </button>

                        {/* Image */}
                        <img
                            src={receipt.url}
                            alt="Receipt full view"
                            className="w-full h-full object-contain rounded-lg"
                        />

                        {/* Download button */}
                        <a
                            href={receipt.url}
                            download={receipt.name || 'receipt'}
                            className="absolute -bottom-12 left-0 text-white hover:text-amber-400 transition flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="material-symbols-outlined text-3xl">download</span>
                            <span className="font-semibold">Download</span>
                        </a>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReceiptViewer;
