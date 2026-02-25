/**
 * File.io Upload Utility
 * Free anonymous file hosting with no authentication required
 */

import Compressor from 'compressorjs';

/**
 * Compress image before upload
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
 * Upload file to File.io
 * @param {File} file - The file to upload
 * @param {Object} options - Upload options
 * @param {string} options.expires - Expiry time (1d, 1w, 1m, 1y, or number of days)
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadToFileIO = async (file, options = {}) => {
    try {
        // Compress image first to save bandwidth
        console.log('🗜️ Compressing image...');
        const compressedFile = await compressImage(file);

        // Create form data
        const formData = new FormData();
        formData.append('file', compressedFile, file.name);

        // Set expiry (default: 1 year)
        const expires = options.expires || '1y';

        console.log('☁️ Uploading to File.io...');

        // Upload to File.io API
        const response = await fetch(`https://file.io/?expires=${expires}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
            console.log('✅ Upload successful!');
            return {
                success: true,
                url: data.link,
                key: data.key,
                expiry: data.expiry,
                size: data.size,
                name: data.name,
            };
        } else {
            throw new Error(data.message || 'Upload failed');
        }
    } catch (error) {
        console.error('❌ Upload error:', error);
        throw error;
    }
};

/**
 * Delete file from File.io
 * @param {string} key - The file key returned from upload
 */
export const deleteFromFileIO = async (key) => {
    try {
        const response = await fetch(`https://file.io/${key}`, {
            method: 'DELETE',
        });

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('❌ Delete error:', error);
        return false;
    }
};

export default uploadToFileIO;
