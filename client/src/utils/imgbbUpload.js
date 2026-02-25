/**
 * ImgBB Upload Utility
 * Free permanent image hosting with API key
 * Get your free API key at: https://api.imgbb.com/
 */

import Compressor from 'compressorjs';

// 🔑 GET YOUR FREE API KEY: https://api.imgbb.com/
// API key is loaded from environment variable for security
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

/**
 * Compress image before upload to save bandwidth
 */
const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        new Compressor(file, {
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1920,
            mimeType: 'image/jpeg',
            success: resolve,
            error: reject,
        });
    });
};

/**
 * Convert file to Base64 string
 */
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // Remove the data:image/png;base64, prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Upload image to ImgBB
 * @param {File} file - The image file to upload
 * @param {Object} options - Upload options
 * @param {string} options.name - Custom name for the image
 * @returns {Promise<Object>} Upload result with permanent URL
 */
export const uploadToImgBB = async (file, options = {}) => {
    // Check API key
    if (IMGBB_API_KEY === 'YOUR_API_KEY_HERE') {
        throw new Error('⚠️ Please set your ImgBB API key! Get one free at https://api.imgbb.com/');
    }

    try {
        console.log('🗜️ Compressing image...');
        const compressedFile = await compressImage(file);

        console.log('📦 Converting to Base64...');
        const base64Image = await fileToBase64(compressedFile);

        console.log('☁️ Uploading to ImgBB...');

        // Create form data
        const formData = new FormData();
        formData.append('image', base64Image);
        if (options.name) {
            formData.append('name', options.name);
        }

        // Upload to ImgBB API
        const response = await fetch(
            `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
            console.log('✅ Upload successful!');
            return {
                success: true,
                url: data.data.url,                        // Full image URL
                displayUrl: data.data.display_url,         // Display URL
                deleteUrl: data.data.delete_url || null,   // Delete URL (null if not present)
                thumb: data.data.thumb?.url || null,       // Thumbnail URL (null if not present)
                medium: data.data.medium?.url || null,     // Medium size URL (null if not present)
                title: data.data.title || null,
                size: data.data.size || 0,
                width: data.data.width || 0,
                height: data.data.height || 0,
                deleteHash: data.data.delete_url?.split('/').pop() || null, // For deletion
            };
        } else {
            throw new Error(data.error?.message || 'Upload failed');
        }
    } catch (error) {
        console.error('❌ ImgBB upload error:', error);
        throw error;
    }
};

/**
 * Delete image from ImgBB
 * Note: You need the delete URL from upload response
 * @param {string} deleteUrl - The delete URL from upload
 */
export const deleteFromImgBB = async (deleteUrl) => {
    try {
        const response = await fetch(deleteUrl, { method: 'GET' });
        return response.ok;
    } catch (error) {
        console.error('❌ Delete error:', error);
        return false;
    }
};

/**
 * Get ImgBB API key status
 */
export const isImgBBConfigured = () => {
    return IMGBB_API_KEY !== 'YOUR_API_KEY_HERE';
};

export default uploadToImgBB;
