// Avatar utility functions for DiceBear integration

export const AVATAR_STYLES = [
    {
        id: 'avataaars',
        name: 'Cartoon',
        emoji: '🎨',
        description: 'Playful cartoon faces'
    },
    {
        id: 'bottts',
        name: 'Robot',
        emoji: '🤖',
        description: 'Cute robot characters'
    },
    {
        id: 'fun-emoji',
        name: 'Animal',
        emoji: '🐱',
        description: 'Fun emoji animals'
    },
    {
        id: 'pixel-art',
        name: 'Pixel',
        emoji: '👾',
        description: 'Retro pixel art'
    },
    {
        id: 'initials',
        name: 'Letters',
        emoji: '👤',
        description: 'Letter-based avatars'
    }
];

/**
 * Generate DiceBear avatar URL
 * @param {string} style - Avatar style (avataaars, bottts, etc.)
 * @param {string} seed - Unique identifier for the avatar
 * @returns {string} Complete avatar URL
 */
export const getAvatarUrl = (style, seed) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
};

/**
 * Generate a random seed for avatar
 * @returns {string} Random seed string
 */
export const getRandomSeed = () => {
    return Math.random().toString(36).substring(2, 15);
};

/**
 * Extract style from DiceBear URL
 * @param {string} url - Avatar URL
 * @returns {string} Style name or default
 */
export const getStyleFromUrl = (url) => {
    if (!url || !url.includes('dicebear.com')) {
        return 'avataaars'; // default
    }

    const match = url.match(/\/7\.x\/([^/]+)\//);
    return match ? match[1] : 'avataaars';
};

/**
 * Get default avatar URL for new users
 * @param {string} userId - User ID to use as seed
 * @returns {string} Default avatar URL
 */
export const getDefaultAvatar = (userId) => {
    return getAvatarUrl('avataaars', userId);
};
