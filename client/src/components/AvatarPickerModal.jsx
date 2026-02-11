import React, { useState, useEffect } from 'react';
import { AVATAR_STYLES, getAvatarUrl, getRandomSeed, getStyleFromUrl, getSeedFromUrl } from '../utils/avatarUtils';
import { useToast } from '../context/ToastContext';

const AvatarPickerModal = ({ isOpen, currentPhotoURL, userId, onClose, onSave }) => {
    const [selectedStyle, setSelectedStyle] = useState('avataaars');
    const [seed, setSeed] = useState(userId);
    const [previewUrl, setPreviewUrl] = useState(currentPhotoURL);

    // Update state when currentPhotoURL changes (e.g., user has changed avatar before)
    useEffect(() => {
        if (currentPhotoURL) {
            const style = getStyleFromUrl(currentPhotoURL);
            const currentSeed = getSeedFromUrl(currentPhotoURL) || userId;
            setSelectedStyle(style);
            setSeed(currentSeed);
            setPreviewUrl(currentPhotoURL);
        }
    }, [currentPhotoURL, userId]);

    const handleStyleSelect = (styleId) => {
        setSelectedStyle(styleId);
        const newUrl = getAvatarUrl(styleId, seed);
        setPreviewUrl(newUrl);
    };

    const handleRandomize = () => {
        const newSeed = getRandomSeed();
        setSeed(newSeed);
        const newUrl = getAvatarUrl(selectedStyle, newSeed);
        setPreviewUrl(newUrl);
    };

    const handleSave = () => {
        onSave(previewUrl, selectedStyle);
        onClose();
    };

    const handleCancel = () => {
        // Reset to current values from props
        if (currentPhotoURL) {
            const style = getStyleFromUrl(currentPhotoURL);
            const currentSeed = getSeedFromUrl(currentPhotoURL) || userId;
            setSelectedStyle(style);
            setSeed(currentSeed);
            setPreviewUrl(currentPhotoURL);
        }
        onClose();
    };

    const [showCamera, setShowCamera] = useState(false);
    const videoRef = React.useRef(null);
    const canvasRef = React.useRef(null);

    const { addToast } = useToast(); // Use toast context for errors

    const startCamera = async () => {
        try {
            setShowCamera(true);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 512 }, height: { ideal: 512 } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setShowCamera(false);
            // Show toast error instead of alert
            addToast("Could not access camera. Please check permissions.", "error");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            // Set canvas dimensions to a small square for the avatar (max 256x256)
            // This ensures the base64 string remains small for Firestore
            const size = 256;
            canvas.width = size;
            canvas.height = size;

            // Calculate cropping to get a center square from the video
            const minDim = Math.min(video.videoWidth, video.videoHeight);
            const startX = (video.videoWidth - minDim) / 2;
            const startY = (video.videoHeight - minDim) / 2;

            // Draw and resize
            context.drawImage(video, startX, startY, minDim, minDim, 0, 0, size, size);

            // Convert to Base64 with compression (0.7 quality)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

            setPreviewUrl(dataUrl);
            setSelectedStyle('custom-camera');
            stopCamera();
        }
    };

    // Cleanup camera on close
    useEffect(() => {
        if (!isOpen) {
            stopCamera();
            setShowCamera(false);
        }
        return () => stopCamera();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1a1c23] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-[#1a1c23] z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Your Avatar</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select a style or take a photo</p>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto">
                    {/* Camera Mode */}
                    {showCamera ? (
                        <div className="flex flex-col items-center gap-4 mb-6 animate-fade-in">
                            <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-amber-400 shadow-xl bg-black">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                                />
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={stopCamera}
                                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={capturePhoto}
                                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg animate-pulse"
                                >
                                    <span className="material-symbols-outlined">camera</span>
                                    Capture
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Preview & Actions */
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-amber-400 shadow-lg mb-4 bg-gray-100 dark:bg-white/5 relative group">
                                <img
                                    src={previewUrl}
                                    alt="Avatar preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleRandomize}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-900 dark:text-white font-medium"
                                >
                                    <span className="material-symbols-outlined text-xl">refresh</span>
                                    Randomize
                                </button>
                                <button
                                    onClick={startCamera}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors text-blue-600 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-500/30"
                                >
                                    <span className="material-symbols-outlined text-xl">photo_camera</span>
                                    Take Photo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Style Selection - Only show if camera is NOT open */}
                    {!showCamera && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {AVATAR_STYLES.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => handleStyleSelect(style.id)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${selectedStyle === style.id
                                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-400/10'
                                        : 'border-gray-200 dark:border-white/10 hover:border-amber-400/50 bg-white dark:bg-white/5'
                                        }`}
                                >
                                    <span className="text-4xl">{style.emoji}</span>
                                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{style.name}</span>
                                    <span className="text-xs text-center text-gray-500 dark:text-gray-400">{style.description}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50 dark:bg-white/5 z-10">
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 rounded-lg bg-amber-400 text-black font-semibold hover:bg-amber-500 transition-colors shadow-md transform active:scale-95"
                    >
                        Save Avatar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarPickerModal;
