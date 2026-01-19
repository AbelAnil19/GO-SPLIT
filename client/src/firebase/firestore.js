import { db } from './firebaseConfig';
import { collection, addDoc, getDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { getDefaultAvatar } from '../utils/avatarUtils';

// ==================== USER FUNCTIONS ====================

export const createUserDocument = async (userId, userData) => {
    try {
        const userRef = doc(db, 'users', userId);

        // Check if document already exists
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            console.log('✅ User document already exists, skipping creation');
            return;
        }

        // Generate default DiceBear avatar if no photoURL provided
        const defaultPhotoURL = userData.photoURL || getDefaultAvatar(userId);

        // Create new document only if it doesn't exist
        await setDoc(userRef, {
            displayName: userData.displayName,
            email: userData.email,
            photoURL: defaultPhotoURL,
            avatarStyle: 'avataaars', // Default style
            groups: [],
            createdAt: serverTimestamp()
        });
        console.log('✅ User document created successfully with default avatar');
    } catch (error) {
        console.error('❌ Error creating user document:', error);
        throw error;
    }
};

export const getUserDocument = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        return userSnap.exists() ? userSnap.data() : null;
    } catch (error) {
        console.error('Error getting user document:', error);
        throw error;
    }
};

export const updateUserDocument = async (userId, data) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, data);
        console.log('✅ User document updated successfully');
    } catch (error) {
        console.error('❌ Error updating user document:', error);
        throw error;
    }
};

// ==================== GROUP FUNCTIONS ====================

export const createGroup = async (groupName, creatorId, creatorData) => {
    try {
        const groupRef = await addDoc(collection(db, 'groups'), {
            name: groupName,
            icon: 'groups',
            members: [{
                userId: creatorId,
                name: creatorData.displayName,
                photoURL: creatorData.photoURL,
                role: 'admin'
            }],
            createdBy: creatorId,
            createdAt: serverTimestamp(),
            totalExpenses: 0,
            createdBy: creatorId,
            createdAt: serverTimestamp(),
            totalExpenses: 0,
            isSettled: false,
            memberIds: [creatorId] // Add this primarily for permissions and querying
        });

        // Add group to user's groups array
        const userRef = doc(db, 'users', creatorId);
        const userSnap = await getDoc(userRef);
        const currentGroups = userSnap.data()?.groups || [];
        await updateDoc(userRef, {
            groups: [...currentGroups, groupRef.id]
        });

        console.log('✅ Group created with ID:', groupRef.id);

        // Log activity
        await createActivity({
            type: 'group_created',
            description: `You created group "${groupName}"`,
            userId: creatorId,
            relatedId: groupRef.id,
            involvedUserIds: [creatorId],
            icon: 'group_add'
        });

        return groupRef.id;
    } catch (error) {
        console.error('❌ Error creating group:', error);
        throw error;
    }
};

export const getUserGroups = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        if (!userData || !userData.groups || userData.groups.length === 0) {
            return [];
        }

        // Get all groups the user is part of
        const groupsPromises = userData.groups.map(async (groupId) => {
            const groupRef = doc(db, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);
            return groupSnap.exists() ? { id: groupSnap.id, ...groupSnap.data() } : null;
        });

        const groups = await Promise.all(groupsPromises);
        return groups.filter(group => group !== null);
    } catch (error) {
        console.error('Error getting user groups:', error);
        throw error;
    }
};

export const listenToUserGroups = (userId, callback) => {
    // Optimized query: Only fetch groups where memberIds contains userId
    // This is much faster and secure with rules
    const q = query(
        collection(db, 'groups'),
        where('memberIds', 'array-contains', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(groups);
    }, (error) => {
        console.error("Error listening to user groups:", error);
    });
};

// ==================== INVITATION FUNCTIONS ====================

export const sendGroupInvitation = async (groupId, groupName, inviterName, memberEmail, inviterId) => {
    try {
        // Find user by email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', memberEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error('User not found. They need to create an account first.');
        }

        const userDoc = querySnapshot.docs[0];
        const userId = userDoc.id;

        // Check if user is already a member
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);
        const groupData = groupSnap.data();

        if (groupData.members.some(m => m.userId === userId)) {
            throw new Error('User is already a member of this group');
        }

        // Check if invitation already exists
        const invitationsRef = collection(db, 'invitations');
        const existingInviteQuery = query(
            invitationsRef,
            where('groupId', '==', groupId),
            where('invitedUserId', '==', userId),
            where('status', '==', 'pending')
        );
        const existingInvites = await getDocs(existingInviteQuery);

        if (!existingInvites.empty) {
            throw new Error('Invitation already sent to this user');
        }

        // Create invitation
        await addDoc(collection(db, 'invitations'), {
            groupId: groupId,
            groupName: groupName,
            invitedUserId: userId,
            invitedUserEmail: memberEmail,
            inviterName: inviterName,
            fromUserId: inviterId, // Add this for security rules
            status: 'pending',
            createdAt: serverTimestamp()
        });

        console.log('✅ Invitation sent');
    } catch (error) {
        console.error('❌ Error sending invitation:', error);
        throw error;
    }
};

export const acceptGroupInvitation = async (invitationId, userId) => {
    try {
        const inviteRef = doc(db, 'invitations', invitationId);
        const inviteSnap = await getDoc(inviteRef);
        const inviteData = inviteSnap.data();

        // Get user data
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        // Add user to group
        const groupRef = doc(db, 'groups', inviteData.groupId);
        const groupSnap = await getDoc(groupRef);
        const groupData = groupSnap.data();

        const newMember = {
            userId: userId,
            name: userData.displayName,
            photoURL: userData.photoURL,
            role: 'member'
        };

        await updateDoc(groupRef, {
            members: [...groupData.members, newMember],
            memberIds: [...(groupData.memberIds || []), userId] // Maintain the ID list
        });

        // Add group to user's groups
        const currentGroups = userSnap.data()?.groups || [];
        await updateDoc(userRef, {
            groups: [...currentGroups, inviteData.groupId]
        });

        // Update invitation status
        await updateDoc(inviteRef, {
            status: 'accepted',
            acceptedAt: serverTimestamp()
        });

        console.log('✅ Invitation accepted');
    } catch (error) {
        console.error('❌ Error accepting invitation:', error);
        throw error;
    }
};

export const declineGroupInvitation = async (invitationId) => {
    try {
        const inviteRef = doc(db, 'invitations', invitationId);
        await updateDoc(inviteRef, {
            status: 'declined',
            declinedAt: serverTimestamp()
        });
        console.log('✅ Invitation declined');
    } catch (error) {
        console.error('❌ Error declining invitation:', error);
        throw error;
    }
};

export const getUserInvitations = async (userId) => {
    try {
        const q = query(
            collection(db, 'invitations'),
            where('invitedUserId', '==', userId),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting invitations:', error);
        throw error;
    }
};

export const listenToUserInvitations = (userId, callback) => {
    const q = query(
        collection(db, 'invitations'),
        where('invitedUserId', '==', userId),
        where('status', '==', 'pending')
    );
    return onSnapshot(q, (snapshot) => {
        const invitations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(invitations);
    });
};

// ==================== EXPENSE FUNCTIONS ====================

export const createExpense = async (expenseData) => {
    try {
        const expenseRef = await addDoc(collection(db, 'expenses'), {
            ...expenseData,
            createdAt: serverTimestamp(),
            date: serverTimestamp(),
            isSettled: false
        });

        // Update group total expenses
        const groupRef = doc(db, 'groups', expenseData.groupId);
        const groupSnap = await getDoc(groupRef);
        const groupData = groupSnap.data();
        const currentTotal = groupData?.totalExpenses || 0;
        await updateDoc(groupRef, {
            totalExpenses: currentTotal + expenseData.amount
        });

        // Log activity
        if (groupData) {
            const memberIds = groupData.memberIds || [];
            await createActivity({
                type: 'expense_added',
                description: `${expenseData.paidByName} added "${expenseData.description}"`,
                userId: expenseData.paidBy,
                relatedId: expenseRef.id,
                groupId: expenseData.groupId,
                amount: expenseData.amount,
                involvedUserIds: memberIds,
                icon: 'receipt_long'
            });

            // Notify all group members except the creator
            const notificationPromises = memberIds
                .filter(memberId => memberId !== expenseData.paidBy)
                .map(memberId =>
                    createNotification(
                        memberId,
                        'expense',
                        'New Expense Added',
                        `${expenseData.paidByName} added ₹${expenseData.amount} for "${expenseData.description}"`,
                        {
                            groupId: expenseData.groupId,
                            expenseId: expenseRef.id,
                            amount: expenseData.amount,
                            fromUserId: expenseData.paidBy,
                            fromUserName: expenseData.paidByName
                        }
                    )
                );
            await Promise.all(notificationPromises);
        }

        console.log('✅ Expense created with ID:', expenseRef.id);
        return expenseRef.id;
    } catch (error) {
        console.error('❌ Error creating expense:', error);
        throw error;
    }
};

export const updateExpense = async (expenseId, updates) => {
    try {
        const expenseRef = doc(db, 'expenses', expenseId);
        await updateDoc(expenseRef, updates);
        console.log('✅ Expense updated:', expenseId);
    } catch (error) {
        console.error('❌ Error updating expense:', error);
        throw error;
    }
};

export const deleteExpense = async (expenseId, groupId, amount) => {
    try {
        await deleteDoc(doc(db, 'expenses', expenseId));

        // Update group total expenses
        if (groupId) {
            const groupRef = doc(db, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);
            if (groupSnap.exists()) {
                const currentTotal = groupSnap.data()?.totalExpenses || 0;
                await updateDoc(groupRef, {
                    totalExpenses: Math.max(0, currentTotal - amount)
                });
            }
        }

        console.log('✅ Expense deleted:', expenseId);
    } catch (error) {
        console.error('❌ Error deleting expense:', error);
        throw error;
    }
};

export const deleteAllCreatedGroups = async (userId) => {
    try {
        const q = query(
            collection(db, 'groups'),
            where('createdBy', '==', userId)
        );
        const snapshot = await getDocs(q);

        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        console.log(`✅ Deleted ${snapshot.size} groups created by user ${userId}`);
        return snapshot.size;
    } catch (error) {
        console.error('❌ Error deleting all groups:', error);
        throw error;
    }
};

export const deleteAllUserExpenses = async (userId) => {
    try {
        console.log('🔍 Starting deleteAllUserExpenses for user:', userId);
        const expensesToDelete = [];
        const affectedGroups = new Set(); // Track which groups need their totals reset

        // 1. Get expenses user paid for
        console.log('📋 Step 1: Fetching expenses paid by user...');
        const paidByQuery = query(
            collection(db, 'expenses'),
            where('paidBy', '==', userId)
        );
        const paidBySnapshot = await getDocs(paidByQuery);
        console.log(`   Found ${paidBySnapshot.size} expenses paid by user`);
        paidBySnapshot.docs.forEach(doc => {
            console.log(`   - Expense: ${doc.id}, Amount: ₹${doc.data().amount}, Group: ${doc.data().groupId}`);
            expensesToDelete.push(doc);
            if (doc.data().groupId) affectedGroups.add(doc.data().groupId);
        });

        // 2. Get groups created by user and ALL their expenses
        console.log('📋 Step 2: Fetching groups created by user...');
        const groupsQuery = query(
            collection(db, 'groups'),
            where('createdBy', '==', userId)
        );
        const groupsSnapshot = await getDocs(groupsQuery);
        console.log(`   Found ${groupsSnapshot.size} groups created by user`);

        for (const groupDoc of groupsSnapshot.docs) {
            console.log(`   - Checking group: ${groupDoc.id} (${groupDoc.data().name})`);
            affectedGroups.add(groupDoc.id); // Always track user-created groups

            const groupExpensesQuery = query(
                collection(db, 'expenses'),
                where('groupId', '==', groupDoc.id)
            );
            const groupExpensesSnapshot = await getDocs(groupExpensesQuery);
            console.log(`     Found ${groupExpensesSnapshot.size} expenses in this group`);
            groupExpensesSnapshot.docs.forEach(doc => {
                // Add if not already in list (avoid duplicates)
                if (!expensesToDelete.find(e => e.id === doc.id)) {
                    console.log(`     + Adding expense: ${doc.id}, Amount: ₹${doc.data().amount}, Paid by: ${doc.data().paidBy}`);
                    expensesToDelete.push(doc);
                } else {
                    console.log(`     = Already in list: ${doc.id}`);
                }
            });
        }

        console.log(`\n🗑️ Total expenses to delete: ${expensesToDelete.length}`);
        console.log(`🏢 Affected groups: ${affectedGroups.size}`);

        // Delete all expenses
        if (expensesToDelete.length > 0) {
            console.log('🔥 Starting deletion process...');
            const deletePromises = expensesToDelete.map((doc, index) => {
                console.log(`   Deleting ${index + 1}/${expensesToDelete.length}: ${doc.id}`);
                return deleteExpense(doc.id, doc.data().groupId, doc.data().amount);
            });
            await Promise.all(deletePromises);
            console.log(`✅ Successfully deleted ${expensesToDelete.length} expenses`);
        } else {
            console.log('⚠️ No expenses found to delete!');
        }

        // Reset totalExpenses for all affected groups
        if (affectedGroups.size > 0) {
            console.log('\n🔄 Resetting totalExpenses for affected groups...');
            const resetPromises = Array.from(affectedGroups).map(async (groupId) => {
                const groupRef = doc(db, 'groups', groupId);
                await updateDoc(groupRef, { totalExpenses: 0 });
                console.log(`   ✅ Reset totalExpenses for group: ${groupId}`);
            });
            await Promise.all(resetPromises);
            console.log(`✅ Reset ${affectedGroups.size} group totals to ₹0`);
        }

        // Delete all user activities (using involvedUserIds to match Dashboard display)
        console.log('\n🗑️ Deleting activity history...');
        const activityQuery = query(
            collection(db, 'activity'),
            where('involvedUserIds', 'array-contains', userId)
        );
        const activitySnapshot = await getDocs(activityQuery);
        const activityDeletePromises = activitySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(activityDeletePromises);
        console.log(`✅ Deleted ${activitySnapshot.size} activity records`);

        return expensesToDelete.length;
    } catch (error) {
        console.error('❌ Error deleting all expenses:', error);
        console.error('Error details:', error.message);
        console.error('Error code:', error.code);
        throw error;
    }
};

export const getGroupExpenses = async (groupId) => {
    try {
        const q = query(
            collection(db, 'expenses'),
            where('groupId', '==', groupId),
            orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting group expenses:', error);
        throw error;
    }
};

export const getUserExpenses = async (userId) => {
    try {
        const q = query(
            collection(db, 'expenses'),
            orderBy('date', 'desc'),
            limit(50)
        );
        const querySnapshot = await getDocs(q);

        const expenses = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(expense =>
                expense.paidBy === userId ||
                expense.splitBetween.some(split => split.userId === userId)
            );

        // Fetch group names for expenses
        const expensesWithGroups = await Promise.all(
            expenses.map(async (expense) => {
                if (expense.groupId) {
                    try {
                        const groupDoc = await getDoc(doc(db, 'groups', expense.groupId));
                        if (groupDoc.exists()) {
                            return { ...expense, groupName: groupDoc.data().name };
                        }
                    } catch (error) {
                        console.error('Error fetching group name:', error);
                    }
                }
                return expense;
            })
        );

        return expensesWithGroups;
    } catch (error) {
        console.error('Error getting user expenses:', error);
        throw error;
    }
};

// ==================== ACTIVITY FUNCTIONS ====================

export const createActivity = async (activityData) => {
    try {
        await addDoc(collection(db, 'activity'), {
            ...activityData,
            timestamp: serverTimestamp()
        });
        console.log('✅ Activity logged');
    } catch (error) {
        console.error('❌ Error creating activity:', error);
        throw error;
    }
};

export const getUserActivity = async (userId, limitCount = 20) => {
    try {
        const q = query(
            collection(db, 'activity'),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting user activity:', error);
        throw error;
    }
};

export const listenToUserActivity = (userId, callback) => {
    // Note: We sort in client to avoid needing a composite index immediately
    const q = query(
        collection(db, 'activity'),
        where('involvedUserIds', 'array-contains', userId),
        limit(50)
    );
    return onSnapshot(q, (snapshot) => {
        const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort client-side
        activities.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        callback(activities);
    });
};


// ==================== SETTLEMENT FUNCTIONS ====================

export const createSettlement = async (fromUserId, toUserId, amount, fromUserData, toUserData) => {
    try {
        const settlement = {
            fromUserId,
            fromUserName: fromUserData.displayName?.split(' ')[0] || 'User',
            fromUserPhoto: fromUserData.photoURL,
            toUserId,
            toUserName: toUserData.displayName?.split(' ')[0] || 'User',
            toUserPhoto: toUserData.photoURL,
            amount,
            status: 'pending',
            createdAt: serverTimestamp(),
            approvedAt: null,
            note: null
        };

        const docRef = await addDoc(collection(db, 'settlements'), settlement);
        console.log('✅ Settlement created:', docRef.id);

        // Notify the receiver
        await createNotification(
            toUserId,
            'settlement',
            'Settlement Request',
            `${fromUserData.displayName?.split(' ')[0]} wants to settle ₹${amount}`,
            {
                settlementId: docRef.id,
                amount,
                fromUserId,
                fromUserName: fromUserData.displayName?.split(' ')[0] || 'User'
            }
        );

        return docRef;
    } catch (error) {
        console.error('❌ Error creating settlement:', error);
        throw error;
    }
};

export const approveSettlement = async (settlementId) => {
    try {
        const settlementRef = doc(db, 'settlements', settlementId);
        const settlementSnap = await getDoc(settlementRef);
        const settlementData = settlementSnap.data();

        await updateDoc(settlementRef, {
            status: 'approved',
            approvedAt: serverTimestamp()
        });
        console.log('✅ Settlement approved:', settlementId);

        // Notify the payer
        if (settlementData) {
            await createNotification(
                settlementData.fromUserId,
                'payment',
                'Payment Approved',
                `${settlementData.toUserName} verified your ₹${settlementData.amount} payment`,
                {
                    settlementId,
                    amount: settlementData.amount,
                    fromUserId: settlementData.toUserId,
                    fromUserName: settlementData.toUserName
                }
            );
        }
    } catch (error) {
        console.error('❌ Error approving settlement:', error);
        throw error;
    }
};

export const rejectSettlement = async (settlementId) => {
    try {
        await deleteDoc(doc(db, 'settlements', settlementId));
        console.log('✅ Settlement rejected/deleted:', settlementId);
    } catch (error) {
        console.error('❌ Error rejecting settlement:', error);
        throw error;
    }
};

export const listenToUserSettlements = (userId, callback) => {
    // Listen to settlements where user is either sender or receiver
    const sentQuery = query(
        collection(db, 'settlements'),
        where('fromUserId', '==', userId)
    );

    const receivedQuery = query(
        collection(db, 'settlements'),
        where('toUserId', '==', userId)
    );

    const unsubscribeSent = onSnapshot(sentQuery, (sentSnapshot) => {
        const unsubscribeReceived = onSnapshot(receivedQuery, (receivedSnapshot) => {
            const settlements = [
                ...sentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                ...receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            ];
            callback(settlements);
        });

        // Store the second unsubscribe function
        listenToUserSettlements._unsubscribeReceived = unsubscribeReceived;
    });

    // Return combined unsubscribe function
    return () => {
        unsubscribeSent();
        if (listenToUserSettlements._unsubscribeReceived) {
            listenToUserSettlements._unsubscribeReceived();
        }
    };
};

// ==================== MESSAGING FUNCTIONS ====================

export const sendMessage = async (groupId, text, currentUser) => {
    try {
        const messagesRef = collection(db, 'groups', groupId, 'messages');
        await addDoc(messagesRef, {
            text,
            senderId: currentUser.uid,
            senderName: currentUser.displayName?.split(' ')[0] || 'User',
            senderPhoto: currentUser.photoURL,
            timestamp: serverTimestamp(),
            type: 'text'
        });
        console.log('✅ Message sent to group:', groupId);

        // Notify all group members except the sender
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);
        const groupData = groupSnap.data();

        if (groupData) {
            const memberIds = groupData.memberIds || [];
            const senderName = currentUser.displayName?.split(' ')[0] || 'User';

            const notificationPromises = memberIds
                .filter(memberId => memberId !== currentUser.uid)
                .map(memberId =>
                    createNotification(
                        memberId,
                        'message',
                        'New Message',
                        `${senderName}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
                        {
                            groupId,
                            groupName: groupData.name,
                            fromUserId: currentUser.uid,
                            fromUserName: senderName
                        }
                    )
                );
            await Promise.all(notificationPromises);
        }
    } catch (error) {
        console.error('❌ Error sending message:', error);
        throw error;
    }
};

export const listenToGroupMessages = (groupId, callback) => {
    const q = query(
        collection(db, 'groups', groupId, 'messages'),
        orderBy('timestamp', 'asc'),
        limit(100)
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(messages);
    });
};

// ==================== NOTIFICATION FUNCTIONS ====================

export const createNotification = async (userId, type, title, message, metadata = {}) => {
    try {
        const notification = {
            userId,
            type,
            title,
            message,
            read: false,
            createdAt: serverTimestamp(),
            metadata
        };

        await addDoc(collection(db, 'notifications'), notification);
        console.log('✅ Notification created for user:', userId);
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        // Don't throw - notifications are non-critical
    }
};

export const listenToUserNotifications = (userId, callback) => {
    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(20)
    );

    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(notifications);
    });
};

export const markNotificationRead = async (notificationId) => {
    try {
        await updateDoc(doc(db, 'notifications', notificationId), {
            read: true
        });
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
    }
};

export const markAllNotificationsRead = async (userId) => {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            where('read', '==', false)
        );

        const snapshot = await getDocs(q);
        const promises = snapshot.docs.map(d =>
            updateDoc(d.ref, { read: true })
        );
        await Promise.all(promises);
        console.log(`✅ Marked ${snapshot.size} notifications as read`);
    } catch (error) {
        console.error('❌ Error marking all notifications as read:', error);
    }
};

// ==================== AVATAR FUNCTIONS ====================

/**
 * Update user's avatar in Firestore and Firebase Auth
 * @param {string} userId - User ID
 * @param {string} photoURL - New avatar URL
 * @param {string} avatarStyle - Selected avatar style
 */
export const updateUserAvatar = async (userId, photoURL, avatarStyle) => {
    try {
        // Update Firestore
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            photoURL,
            avatarStyle,
            updatedAt: serverTimestamp()
        });

        console.log('✅ User avatar updated in Firestore');
    } catch (error) {
        console.error('❌ Error updating user avatar:', error);
        throw error;
    }
};
