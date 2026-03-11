import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadToImgBB, isImgBBConfigured } from '../utils/imgbbUpload';

const ReceiptUpload = ({ onUploadComplete, existingReceipt }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(existingReceipt?.url || null);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    const handleUpload = useCallback(async (file) => {
        // Check API key
        if (!isImgBBConfigured()) {
            setError('⚠️ ImgBB API key not configured. Please add your key to imgbbUpload.js');
            return;
        }

        setUploading(true);
        setError(null);
        setProgress(10);

        try {
            // Create preview immediately
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
            setProgress(30);

            // Upload to ImgBB (permanent storage!)
            const result = await uploadToImgBB(file, {
                name: `receipt_${Date.now()}`
            });

            setProgress(100);

            // Callback to parent with receipt data
            onUploadComplete({
                url: result.url,              // Full image URL
                thumb: result.thumb,          // Thumbnail
                medium: result.medium,        // Medium size
                deleteUrl: result.deleteUrl,  // For deletion
                name: file.name,
                size: result.size,
                width: result.width,
                height: result.height,
                uploadedAt: new Date().toISOString(),
            });

            // Clean up preview blob
            URL.revokeObjectURL(previewUrl);

        } catch (err) {
            setError(err.message || 'Failed to upload receipt. Please try again.');
            setPreview(null);
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
            setProgress(0);
        }
    }, [onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif']
        },
        maxSize: 10 * 1024 * 1024, // 10MB limit (ImgBB allows up to 32MB)
        multiple: false,
        onDrop: (acceptedFiles, rejectedFiles) => {
            if (rejectedFiles.length > 0) {
                const rejection = rejectedFiles[0];
                if (rejection.file.size > 10 * 1024 * 1024) {
                    setError('File too large. Maximum size is 10MB.');
                } else {
                    setError('Invalid file type. Please upload an image.');
                }
                return;
            }

            if (acceptedFiles.length > 0) {
                handleUpload(acceptedFiles[0]);
            }
        }
    });

    const handleRemove = () => {
        setPreview(null);
        setError(null);
        onUploadComplete(null);
    };

    return (
        <div className="receipt-upload">
            {preview ? (
                // Preview mode - Receipt uploaded successfully
                <div className="relative">
                    <div className="relative group">
                        <img
                            src={preview}
                            alt="Receipt preview"
                            className="w-full h-48 object-cover rounded-xl border-2 border-green-200 dark:border-green-800"
                        />
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Uploaded
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">cloud_done</span>
                            Receipt saved permanently
                        </p>
                        <button
                            onClick={handleRemove}
                            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 hover:dark:text-red-300 flex items-center gap-1 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                            Remove
                        </button>
                    </div>
                </div>
            ) : (
                // Upload zone - Drag & drop area
                <div
                    {...getRootProps()}
                    className={`
                        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                        transition-all duration-200
                        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                        ${isDragActive
                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/10 scale-105'
                            : 'border-gray-300 dark:border-white/20 hover:border-amber-400 dark:hover:border-amber-400 hover:bg-gray-50 dark:hover:bg-white/5'
                        }
                        ${error ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : ''}
                    `}
                >
                    <input {...getInputProps()} disabled={uploading} />

                    {uploading ? (
                        // Uploading state
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 border-4 border-amber-100 dark:border-amber-900/30 rounded-full"></div>
                                <div
                                    className="absolute inset-0 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"
                                    style={{ animationDuration: '0.8s' }}
                                ></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                        {progress}%
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    Uploading receipt...
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Compressing & uploading to ImgBB
                                </p>
                            </div>
                        </div>
                    ) : (
                        // Default upload state
                        <div className="flex flex-col items-center gap-3">
                            <div className={`
                                w-16 h-16 rounded-full flex items-center justify-center transition-all
                                ${isDragActive
                                    ? 'bg-amber-400 text-white scale-110'
                                    : 'bg-amber-100 dark:bg-amber-900/20'
                                }
                            `}>
                                <span className={`
                                    material-symbols-outlined text-4xl transition-colors
                                    ${isDragActive ? 'text-white' : 'text-amber-600 dark:text-amber-400'}
                                `}>
                                    {isDragActive ? 'file_download' : 'add_photo_alternate'}
                                </span>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                                    {isDragActive ? '📸 Drop receipt here!' : '📎 Upload Receipt'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Drag & drop or click to browse
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    JPG, PNG, WEBP, GIF (max 10MB)
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                                    ✓ Stored permanently & free
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-lg">error</span>
                                {error}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ImgBB Attribution (optional but nice) */}
            {!error && !uploading && !preview && (
                <p className="mt-2 text-xs text-center text-gray-400 dark:text-gray-600">
                    Powered by ImgBB • Free permanent image hosting
                </p>
            )}
        </div>
    );
};

export default ReceiptUpload;
