import { db } from './firebaseConfig';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';

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

        // Create new document only if it doesn't exist
        await setDoc(userRef, {
            displayName: userData.displayName,
            email: userData.email,
            photoURL: userData.photoURL,
            groups: [],
            createdAt: serverTimestamp()
        });
        console.log('✅ User document created successfully');
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
            isSettled: false
        });

        // Add group to user's groups array
        const userRef = doc(db, 'users', creatorId);
        const userSnap = await getDoc(userRef);
        const currentGroups = userSnap.data()?.groups || [];
        await updateDoc(userRef, {
            groups: [...currentGroups, groupRef.id]
        });

        console.log('✅ Group created with ID:', groupRef.id);
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
    const q = query(collection(db, 'groups'));
    return onSnapshot(q, (snapshot) => {
        const groups = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(group =>
                group.members.some(member => member.userId === userId)
            );
        callback(groups);
    });
};

// ==================== INVITATION FUNCTIONS ====================

export const sendGroupInvitation = async (groupId, groupName, inviterName, memberEmail) => {
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
            members: [...groupData.members, newMember]
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
        const currentTotal = groupSnap.data()?.totalExpenses || 0;
        await updateDoc(groupRef, {
            totalExpenses: currentTotal + expenseData.amount
        });

        console.log('✅ Expense created with ID:', expenseRef.id);
        return expenseRef.id;
    } catch (error) {
        console.error('❌ Error creating expense:', error);
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

        return querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(expense =>
                expense.paidBy === userId ||
                expense.splitBetween.some(split => split.userId === userId)
            );
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

// ==================== SETTLEMENT FUNCTIONS ====================

export const createSettlement = async (settlementData) => {
    try {
        const settlementRef = await addDoc(collection(db, 'settlements'), {
            ...settlementData,
            date: serverTimestamp(),
            status: 'pending'
        });
        console.log('✅ Settlement created with ID:', settlementRef.id);
        return settlementRef.id;
    } catch (error) {
        console.error('❌ Error creating settlement:', error);
        throw error;
    }
};

export const getGroupSettlements = async (groupId) => {
    try {
        const q = query(
            collection(db, 'settlements'),
            where('groupId', '==', groupId),
            orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting group settlements:', error);
        throw error;
    }
};
