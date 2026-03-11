import { db } from './firebaseConfig';
import {
    collection, addDoc, getDoc, getDocs, doc, updateDoc,
    setDoc, query, where, orderBy, onSnapshot, serverTimestamp, increment
} from 'firebase/firestore';

// ==================== SUPPORT CHAT FUNCTIONS ====================

/**
 * Get or create a support chat thread for a user.
 * Each user has exactly one support chat document.
 */
export const getOrCreateSupportChat = async (user) => {
    if (!user?.uid) throw new Error('User required');

    const chatRef = doc(db, 'support_chats', user.uid);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
        return { id: chatSnap.id, ...chatSnap.data() };
    }

    // Create new support chat
    const chatData = {
        userId: user.uid,
        userName: user.displayName || 'User',
        userEmail: user.email || '',
        userPhotoURL: user.photoURL || null,
        status: 'open',
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        unreadByAdmin: 0,
        unreadByUser: 0
    };

    await setDoc(chatRef, chatData);
    return { id: user.uid, ...chatData };
};

/**
 * Send a message in a support chat thread.
 * role: 'user' | 'admin'
 */
export const sendSupportMessage = async (chatId, senderId, senderName, senderRole, text) => {
    if (!text?.trim()) return;

    const messagesRef = collection(db, 'support_chats', chatId, 'messages');
    await addDoc(messagesRef, {
        senderId,
        senderName,
        senderRole,
        text: text.trim(),
        createdAt: serverTimestamp()
    });

    // Update the parent chat document
    const chatRef = doc(db, 'support_chats', chatId);
    const updateData = {
        lastMessage: text.trim(),
        lastMessageAt: serverTimestamp(),
        status: 'open'
    };

    // Increment unread count for the other party
    if (senderRole === 'user') {
        updateData.unreadByAdmin = increment(1);
        updateData.unreadByUser = 0;
    } else {
        updateData.unreadByUser = increment(1);
        updateData.unreadByAdmin = 0;
    }

    await updateDoc(chatRef, updateData);
};

/**
 * Subscribe to real-time messages in a support chat.
 * Returns an unsubscribe function.
 */
export const subscribeToChatMessages = (chatId, callback) => {
    const messagesRef = collection(db, 'support_chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(messages);
    });
};

/**
 * Get all support chats (for admin view), ordered by most recent.
 * Returns an unsubscribe function for real-time updates.
 */
export const subscribeToAllSupportChats = (callback) => {
    const chatsRef = collection(db, 'support_chats');
    const q = query(chatsRef, orderBy('lastMessageAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const chats = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(chats);
    });
};

/**
 * Mark a chat as read by the admin (clear unreadByAdmin).
 */
export const markChatReadByAdmin = async (chatId) => {
    const chatRef = doc(db, 'support_chats', chatId);
    await updateDoc(chatRef, { unreadByAdmin: 0 });
};

/**
 * Mark a chat as read by the user (clear unreadByUser).
 */
export const markChatReadByUser = async (chatId) => {
    const chatRef = doc(db, 'support_chats', chatId);
    await updateDoc(chatRef, { unreadByUser: 0 });
};

/**
 * Mark a support chat as resolved.
 */
export const resolveSupportChat = async (chatId) => {
    const chatRef = doc(db, 'support_chats', chatId);
    await updateDoc(chatRef, { status: 'resolved' });
};
