import { db } from './firebaseConfig';
import { collection, addDoc, getDoc, getDocs, doc, updateDoc, deleteDoc, setDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, arrayUnion, startAfter } from 'firebase/firestore';
import { getDefaultAvatar } from '../utils/avatarUtils';

// ==================== USER FUNCTIONS ====================

export const createUserDocument = async (userId, userData) => {
    try {
        const userRef = doc(db, 'users', userId);

        // Check if document already exists
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            console.log('âœ… User document already exists, skipping creation');
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
            currency: 'INR', // Default currency for new users
            language: 'en', // Default language
            groups: [],
            createdAt: serverTimestamp()
        });
        console.log('âœ… User document created successfully with default avatar');
    } catch (error) {
        console.error('âŒ Error creating user document:', error);
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

        // If displayName is being updated, also update Firebase Auth profile
        if (data.displayName) {
            const { auth } = await import('./firebaseConfig');
            const { updateProfile } = await import('firebase/auth');
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: data.displayName
                });
            }
        }

        console.log('âœ… User document updated successfully');
    } catch (error) {
        console.error('âŒ Error updating user document:', error);
        throw error;
    }
};

// ==================== USER DELETION FUNCTIONS (PHASE 1) ====================

/**
 * Calculate user's net balance across all expenses
 * Returns: { netBalance, totalPaid, totalReceived, breakdown }
 */
export const calculateUserNetBalance = async (userId) => {
    try {
        // Get ALL expenses in groups where user is a member
        // Since we can't query nested arrays directly, we fetch expenses from user's groups
        const userGroupsQuery = query(
            collection(db, 'groups'),
            where('memberIds', 'array-contains', userId)
        );
        const groupsSnapshot = await getDocs(userGroupsQuery);
        const userGroupIds = groupsSnapshot.docs.map(doc => doc.id);

        console.log('ðŸ” DEBUG: User is in', userGroupIds.length, 'groups');

        // Fetch all expenses from these groups
        let allExpenses = [];
        for (const groupId of userGroupIds) {
            const expensesQuery = query(
                collection(db, 'expenses'),
                where('groupId', '==', groupId)
            );
            const expensesSnapshot = await getDocs(expensesQuery);
            const groupExpenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            allExpenses = allExpenses.concat(groupExpenses);
        }

        // Filter to only expenses where user is involved (paid or in splitBetween)
        const userExpenses = allExpenses.filter(expense => {
            const isPayer = expense.paidBy === userId;
            const isParticipant = expense.splitBetween?.some(split => split.userId === userId);
            return isPayer || isParticipant;
        });

        // Use the existing getPendingSettlements utility (it's already correct!)
        const { getPendingSettlements } = await import('../utils/expenseCalculator');
        const pendingSettlements = getPendingSettlements(userExpenses, userId);

        // Calculate totals from settlements
        let totalOwed = 0;  // Others owe you
        let totalOwe = 0;   // You owe others

        pendingSettlements.forEach(settlement => {
            if (settlement.type === 'owed') {
                totalOwed += settlement.amount;
            } else {
                totalOwe += settlement.amount;
            }
        });

        const netBalance = totalOwed - totalOwe;

        return {
            netBalance: parseFloat(netBalance.toFixed(2)),
            totalOwed: parseFloat(totalOwed.toFixed(2)),
            totalOwe: parseFloat(totalOwe.toFixed(2)),
            pendingSettlements, // Include individual settlements for detailed view
            totalExpenses: userExpenses.length
        };
    } catch (error) {
        console.error('âŒ Error calculating user balance:', error);
        throw error;
    }
};

/**
 * Check if user can be safely deleted
 * Returns: { canDelete, blockers, netBalance, adminGroups }
 */
export const checkUserCanDelete = async (userId) => {
    try {
        const blockers = [];

        // 1. Check net balance
        const { netBalance } = await calculateUserNetBalance(userId);
        if (Math.abs(netBalance) > 0.01) { // Allow 1 paisa tolerance for floating point
            blockers.push(`Unsettled balance: ₹${netBalance.toFixed(2)}`);
        }

        // 2. Check if user is admin of any groups
        const groupsQuery = query(
            collection(db, 'groups'),
            where('createdBy', '==', userId)
        );
        const groupsSnapshot = await getDocs(groupsQuery);
        const adminGroups = [];

        groupsSnapshot.forEach((docSnap) => {
            const group = { id: docSnap.id, ...docSnap.data() };
            adminGroups.push(group);
        });

        if (adminGroups.length > 0) {
            blockers.push(`Admin of ${adminGroups.length} group(s) - ownership must be transferred`);
        }

        const canDelete = blockers.length === 0;

        console.log(`âœ… Deletion check for user ${userId}: ${canDelete ? 'ALLOWED' : 'BLOCKED'}`);

        return {
            canDelete,
            blockers,
            netBalance,
            adminGroups
        };
    } catch (error) {
        console.error('âŒ Error checking user deletion eligibility:', error);
        throw error;
    }
};

/**
 * Create a snapshot of user data before deletion
 * Stores backup in user document and separate deletedUsers collection
 */
export const createDeletionSnapshot = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error('User not found');
        }

        const userData = userSnap.data();
        const balanceData = await calculateUserNetBalance(userId);

        // Get user's groups
        const groupsQuery = query(
            collection(db, 'groups'),
            where('memberIds', 'array-contains', userId)
        );
        const groupsSnapshot = await getDocs(groupsQuery);
        const groups = groupsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
        }));

        const snapshot = {
            userId,
            displayName: userData.displayName,
            email: userData.email,
            balance: balanceData,
            groups,
            deletedAt: new Date().toISOString(),
            originalData: userData
        };

        // Store in user's preDeleteSnapshot field
        await updateDoc(userRef, {
            preDeleteSnapshot: snapshot
        });

        // Also store in separate deletedUsers collection for admin audit
        await setDoc(doc(db, 'deletedUsers', userId), snapshot);

        console.log('âœ… Deletion snapshot created for user:', userId);
        return snapshot;
    } catch (error) {
        console.error('âŒ Error creating deletion snapshot:', error);
        throw error;
    }
};

/**
 * Transfer ownership of groups where user is admin
 * Assigns to next available member or marks group for deletion
 */
export const transferGroupOwnership = async (userId) => {
    try {
        const groupsQuery = query(
            collection(db, 'groups'),
            where('createdBy', '==', userId)
        );
        const groupsSnapshot = await getDocs(groupsQuery);

        const transfers = [];

        for (const docSnap of groupsSnapshot.docs) {
            const groupId = docSnap.id;
            const groupData = docSnap.data();
            const members = groupData.members || [];

            // Find another active member to transfer to
            const otherMembers = members.filter(m => m.userId !== userId);

            if (otherMembers.length > 0) {
                // Transfer to first available member
                const newAdmin = otherMembers[0];

                await updateDoc(doc(db, 'groups', groupId), {
                    createdBy: newAdmin.userId,
                    // Update role in members array
                    members: members.map(m => ({
                        ...m,
                        role: m.userId === newAdmin.userId ? 'admin' :
                            m.userId === userId ? 'member' : m.role
                    }))
                });

                transfers.push({
                    groupId,
                    groupName: groupData.name,
                    newAdmin: newAdmin.name,
                    action: 'transferred'
                });

                console.log(`âœ… Transferred group "${groupData.name}" to ${newAdmin.name}`);
            } else {
                // Solo admin - mark group for deletion or leave as-is
                // (You might want different logic here)
                transfers.push({
                    groupId,
                    groupName: groupData.name,
                    action: 'marked_for_cleanup'
                });

                console.log(`âš ï¸ Group "${groupData.name}" has no other members`);
            }
        }

        console.log(`âœ… Transferred ownership of ${transfers.length} groups`);
        return transfers;
    } catch (error) {
        console.error('âŒ Error transferring group ownership:', error);
        throw error;
    }
};

/**
 * Perform soft delete of user account
 * Preserves data but marks user as deleted
 */
export const softDeleteUserAccount = async (userId, options = {}) => {
    try {
        console.log(`Starting soft delete for user ${userId}...`);

        // 1. Final Safety Check
        const check = await checkUserCanDelete(userId);
        if (!check.canDelete && !options.force) {
            throw new Error(`Cannot delete: ${check.blockers.join(', ')}`);
        }

        // 2. Create Data Snapshot (Backup) - TEMPORARILY DISABLED DUE TO PERMISSIONS
        // await createDeletionSnapshot(userId);
        console.log('âš ï¸ Skipping deletion snapshot (temporarily disabled)');


        // 3. Transfer Group Ownerships
        await transferGroupOwnership(userId);

        // 4. Anonymize user in ALL groups (so they appear as "User (deleted)")
        const userGroupsQuery = query(
            collection(db, 'groups'),
            where('memberIds', 'array-contains', userId)
        );
        const userGroupsSnap = await getDocs(userGroupsQuery);

        const anonymizePromises = userGroupsSnap.docs.map(docSnap => {
            const groupData = docSnap.data();
            const updatedMembers = groupData.members.map(m => {
                if (m.userId === userId) {
                    return {
                        ...m,
                        name: 'User (deleted)',
                        photoURL: null,
                        email: null // Remove PII
                    };
                }
                return m;
            });
            return updateDoc(doc(db, 'groups', docSnap.id), { members: updatedMembers });
        });
        await Promise.all(anonymizePromises);
        console.log(`âœ… Anonymized user in ${anonymizePromises.length} groups`);

        // 5. Mark User as Deleted (Soft Delete)
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            deleted: true,
            deletedAt: serverTimestamp(),
            deletionReason: options.reason || 'User requested deletion',
            // We keep the original display name in the snapshot, 
            // but update the main doc to indicate deletion
            displayName: 'User (deleted)',
            photoURL: null,
            previousDisplayName: check.adminGroups?.[0]?.members?.find(m => m.userId === userId)?.name || 'Unknown'
        });

        console.log('âœ… User soft deleted successfully');
        return true;

    } catch (error) {
        console.error('âŒ Error in soft delete:', error);
        throw error;
    }
};

// ==================== 2FA FUNCTIONS ====================

/**
 * Enables 2FA for a user by saving their verified secret key.
 */
export const enableUser2FA = async (userId, secretKey) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            is2FAEnabled: true,
            twoFactorSecret: secretKey
        });
        console.log('✅ 2FA enabled successfully for user:', userId);
        return true;
    } catch (error) {
        console.error('❌ Error enabling 2FA:', error);
        throw error;
    }
};

/**
 * Disables 2FA for a user by clearing their secret key.
 */
export const disableUser2FA = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            is2FAEnabled: false,
            twoFactorSecret: null
        });
        console.log('✅ 2FA disabled successfully for user:', userId);
        return true;
    } catch (error) {
        console.error('❌ Error disabling 2FA:', error);
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
            isSettled: false,
            memberIds: [creatorId], // Add this primarily for permissions and querying
            customization: {
                icon: 'ðŸ’°', // Default emoji icon
                color: '#F59E0B', // Default amber color
                description: '',
                category: 'Other'
            }
        });

        // Add group to user's groups array
        const userRef = doc(db, 'users', creatorId);
        const userSnap = await getDoc(userRef);
        const currentGroups = userSnap.data()?.groups || [];
        await updateDoc(userRef, {
            groups: [...currentGroups, groupRef.id]
        });

        console.log('âœ… Group created with ID:', groupRef.id);

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
        console.error('âŒ Error creating group:', error);
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

// Delete a group (creator only)
export const deleteGroup = async (groupId, userId) => {
    try {
        // Get the group document
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            throw new Error('Group not found');
        }

        const groupData = groupSnap.data();

        // Check if the current user is the creator
        if (groupData.createdBy !== userId) {
            throw new Error('Only the group creator can delete this group');
        }

        // Delete all expenses associated with this group
        const expensesQuery = query(
            collection(db, 'expenses'),
            where('groupId', '==', groupId)
        );
        const expensesSnapshot = await getDocs(expensesQuery);

        const deletePromises = expensesSnapshot.docs.map(expenseDoc =>
            deleteDoc(doc(db, 'expenses', expenseDoc.id))
        );
        await Promise.all(deletePromises);

        console.log(`âœ… Deleted ${expensesSnapshot.size} expenses from group`);

        // Remove group from all members' groups arrays
        const memberIds = groupData.memberIds || [];
        const userUpdatePromises = memberIds.map(async (memberId) => {
            const userRef = doc(db, 'users', memberId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const currentGroups = userSnap.data()?.groups || [];
                await updateDoc(userRef, {
                    groups: currentGroups.filter(gId => gId !== groupId)
                });
            }
        });
        await Promise.all(userUpdatePromises);

        // Delete the group document
        await deleteDoc(groupRef);

        console.log('âœ… Group deleted successfully');

        // Log activity
        await createActivity({
            type: 'group_deleted',
            description: `You deleted group "${groupData.name}"`,
            userId: userId,
            relatedId: groupId,
            involvedUserIds: memberIds,
        });

        return { success: true, message: 'Group deleted successfully' };
    } catch (error) {
        console.error('âŒ Error deleting group:', error);
        throw error;
    }
};

// Update group customization (admin only)
export const updateGroupCustomization = async (groupId, userId, customization) => {
    try {
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            throw new Error('Group not found');
        }

        const groupData = groupSnap.data();

        // Check if user is admin
        const userMember = groupData.members.find(m => m.userId === userId);
        if (!userMember || userMember.role !== 'admin') {
            throw new Error('Only admins can customize the group');
        }

        // Update customization
        await updateDoc(groupRef, {
            customization: {
                icon: customization.icon || groupData.customization?.icon || 'ðŸ’°',
                color: customization.color || groupData.customization?.color || '#F59E0B',
                description: customization.description !== undefined ? customization.description : (groupData.customization?.description || ''),
                category: customization.category || groupData.customization?.category || 'Other'
            }
        });

        console.log('âœ… Group customization updated');
    } catch (error) {
        console.error('âŒ Error updating group customization:', error);
        throw error;
    }
};

// Remove a member from a group (creator only)
export const removeMemberFromGroup = async (groupId, memberUserId, currentUserId) => {
    try {
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            throw new Error('Group not found');
        }

        const groupData = groupSnap.data();

        // Check if current user is the group creator
        if (groupData.createdBy !== currentUserId) {
            throw new Error('Only the group creator can remove members');
        }

        // Prevent removing yourself
        if (memberUserId === currentUserId) {
            throw new Error('You cannot remove yourself from the group');
        }

        // Remove the member from the members array
        const updatedMembers = groupData.members.filter(member => member.userId !== memberUserId);

        // Remove from memberIds array (CRITICAL for permissions)
        const updatedMemberIds = (groupData.memberIds || []).filter(id => id !== memberUserId);

        await updateDoc(groupRef, {
            members: updatedMembers,
            memberIds: updatedMemberIds
        });

        // Update user's groups array for consistency
        try {
            const userRef = doc(db, 'users', memberUserId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const currentGroups = userData.groups || [];
                const updatedUserGroups = currentGroups.filter(id => id !== groupId);

                await updateDoc(userRef, {
                    groups: updatedUserGroups
                });
            }
        } catch (userUpdateError) {
            console.warn('âš ï¸ Error updating user groups array:', userUpdateError);
        }

        // Clean up pending settlements involving this member
        try {
            const settlementsQuery = query(
                collection(db, 'settlements'),
                where('groupId', '==', groupId),
                where('status', '==', 'pending')
            );

            const settlementsSnap = await getDocs(settlementsQuery);
            const settlementsToDelete = settlementsSnap.docs.filter(doc => {
                const data = doc.data();
                return data.fromUserId === memberUserId || data.toUserId === memberUserId;
            });

            // Delete settlements in parallel
            const deletePromises = settlementsToDelete.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            console.log(`âœ… Cleaned up ${settlementsToDelete.length} settlements for removed member`);
        } catch (settlementError) {
            console.warn('âš ï¸ Error cleaning up settlements:', settlementError);
            // Don't fail the whole operation if settlement cleanup fails
        }

        // Create notification for the removed member
        await createNotification(
            memberUserId,
            'system',
            'Removed from Group',
            `You have been removed from the group "${groupData.name}" by the admin.`,
            { groupId: groupId, groupName: groupData.name }
        );

        console.log('âœ… Member removed from group successfully');
        return { success: true, message: 'Member removed successfully' };
    } catch (error) {
        console.error('âŒ Error removing member from group:', error);
        throw error;
    }
};

// Leave a group (for non-admin members)
export const leaveGroup = async (groupId, userId) => {
    try {
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            throw new Error('Group not found');
        }

        const groupData = groupSnap.data();

        // Prevent admin (creator) from leaving
        if (groupData.createdBy === userId) {
            throw new Error('Group admins cannot leave. You must delete the group instead.');
        }

        // Remove from members array
        const updatedMembers = groupData.members.filter(member => member.userId !== userId);

        // Remove from memberIds array
        const updatedMemberIds = (groupData.memberIds || []).filter(id => id !== userId);

        await updateDoc(groupRef, {
            members: updatedMembers,
            memberIds: updatedMemberIds
        });

        // Update user's groups array
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const currentGroups = userData.groups || [];
                const updatedUserGroups = currentGroups.filter(id => id !== groupId);

                await updateDoc(userRef, {
                    groups: updatedUserGroups
                });
            }
        } catch (userUpdateError) {
            console.warn('âš ï¸ Error updating user groups array:', userUpdateError);
        }

        // Clean up pending settlements involving this member
        try {
            const settlementsQuery = query(
                collection(db, 'settlements'),
                where('groupId', '==', groupId),
                where('status', '==', 'pending')
            );

            const settlementsSnap = await getDocs(settlementsQuery);
            const settlementsToDelete = settlementsSnap.docs.filter(doc => {
                const data = doc.data();
                return data.fromUserId === userId || data.toUserId === userId;
            });

            const deletePromises = settlementsToDelete.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
        } catch (settlementError) {
            console.warn('âš ï¸ Error cleaning up settlements:', settlementError);
        }

        console.log('âœ… User left group successfully');
        return { success: true, message: 'You have left the group' };
    } catch (error) {
        console.error('âŒ Error leaving group:', error);
        throw error;
    }
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

        if (!groupSnap.exists()) throw new Error('Group not found');

        const groupData = groupSnap.data();

        if (groupData.members?.some(m => m.userId === userId)) {
            throw new Error('User is already a member of this group');
        }

        // ADMIN VERIFICATION LOGIC
        // If the inviter is NOT the admin (creator), send a request instead
        if (groupData.createdBy !== inviterId) {
            // Create notification for Admin
            // Note: We skip checking for duplicates here to avoid permission errors (reading admin's notifications)
            await createNotification(
                groupData.createdBy,
                'approval_request',
                'Join Request',
                `${inviterName} wants to add ${memberEmail} to "${groupName}"`,
                {
                    groupId: groupId,
                    groupName: groupName,
                    targetUserId: userId,
                    targetUserEmail: memberEmail,
                    requesterName: inviterName,
                    requesterId: inviterId
                }
            );

            return { success: true, message: 'Request sent to admin for approval', pendingApproval: true };
        }

        // --- DIRECT INVITATION (Admins only) ---

        // Check if invitation already exists
        const invitationsRef = collection(db, 'invitations');
        const existingInviteQuery = query(
            invitationsRef,
            where('groupId', '==', groupId),
            where('invitedUserId', '==', userId),
            where('fromUserId', '==', inviterId),
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
            fromUserId: inviterId,
            status: 'pending',
            createdAt: serverTimestamp()
        });

        console.log('âœ… Invitation sent');
        return { success: true, message: `Invitation sent to ${memberEmail}` };
    } catch (error) {
        console.error('âŒ Error sending invitation:', error);
        throw error;
    }
};

export const approveJoinRequest = async (notificationId, data, adminName) => {
    try {
        // 1. Create the actual invitation
        await addDoc(collection(db, 'invitations'), {
            groupId: data.groupId,
            groupName: data.groupName,
            invitedUserId: data.targetUserId,
            invitedUserEmail: data.targetUserEmail,
            inviterName: adminName, // Admin is technically the one inviting now
            fromUserId: data.requesterId, // Keep original requester for reference, or use admin? Let's use generic
            status: 'pending',
            createdAt: serverTimestamp()
        });

        // 2. Delete the request notification
        await deleteDoc(doc(db, 'notifications', notificationId));

        return { success: true };
    } catch (error) {
        console.error('Error approving request:', error);
        throw error;
    }
};

export const rejectJoinRequest = async (notificationId) => {
    try {
        await deleteDoc(doc(db, 'notifications', notificationId));
        return { success: true };
    } catch (error) {
        console.error('Error rejecting request:', error);
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

        // CHECK: Is user already a member?
        const isAlreadyMember = groupData.members?.some(m => m.userId === userId);

        if (!isAlreadyMember) {
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
            if (!currentGroups.includes(inviteData.groupId)) {
                await updateDoc(userRef, {
                    groups: [...currentGroups, inviteData.groupId]
                });
            }

            // Send "User joined" system message ONLY if they weren't already a member
            try {
                await sendMessage(inviteData.groupId, `${userData?.displayName || 'A new member'} joined the group`, {
                    uid: 'SYSTEM',
                    displayName: 'System',
                    photoURL: null
                }, { type: 'system' });
            } catch (msgError) {
                console.warn('Failed to send join message:', msgError);
            }
        } else {
            console.log('âš ï¸ User is already a member, skipping addition but updating invite status');
        }

        // Update invitation status (mark as accepted regardless, to clear it)
        await updateDoc(inviteRef, {
            status: 'accepted',
            acceptedAt: serverTimestamp()
        });

        console.log('âœ… Invitation accepted');
    } catch (error) {
        console.error('âŒ Error accepting invitation:', error);
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
        console.log('âœ… Invitation declined');
    } catch (error) {
        console.error('âŒ Error declining invitation:', error);
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

            // Send System Message to Group Chat
            try {
                await sendMessage(
                    expenseData.groupId,
                    `${expenseData.paidByName} added "${expenseData.description}" for ${expenseData.currency || '₹'} ${expenseData.amount}`,
                    {
                        uid: 'SYSTEM',
                        displayName: 'System',
                        photoURL: null
                    },
                    { type: 'system' }
                );
            } catch (msgError) {
                console.warn('Failed to send expense system message:', msgError);
            }

            // Notify all group members except the creator
            const notificationPromises = memberIds
                .filter(memberId => memberId !== expenseData.paidBy)
                .map(memberId =>
                    createNotification(
                        memberId,
                        'expense',
                        'New Expense Added',
                        `${expenseData.paidByName} added ${expenseData.amount} ${expenseData.currency || 'INR'} for "${expenseData.description}"`,
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

        console.log('âœ… Expense created with ID:', expenseRef.id);
        return expenseRef.id;
    } catch (error) {
        console.error('âŒ Error creating expense:', error);
        throw error;
    }
};

export const updateExpense = async (expenseId, updates) => {
    try {
        const expenseRef = doc(db, 'expenses', expenseId);
        await updateDoc(expenseRef, updates);
        console.log('âœ… Expense updated:', expenseId);
    } catch (error) {
        console.error('âŒ Error updating expense:', error);
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

        console.log('âœ… Expense deleted:', expenseId);
    } catch (error) {
        console.error('âŒ Error deleting expense:', error);
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

        console.log(`âœ… Deleted ${snapshot.size} groups created by user ${userId}`);
        return snapshot.size;
    } catch (error) {
        console.error('âŒ Error deleting all groups:', error);
        throw error;
    }
};

export const deleteAllUserExpenses = async (userId) => {
    try {
        console.log('ðŸ” Starting deleteAllUserExpenses for user:', userId);
        const expensesToDelete = [];
        const affectedGroups = new Set(); // Track which groups need their totals reset

        // 1. Get expenses user paid for
        console.log('ðŸ“‹ Step 1: Fetching expenses paid by user...');
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
        console.log('ðŸ“‹ Step 2: Fetching groups created by user...');
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

        console.log(`\nðŸ—‘ï¸ Total expenses to delete: ${expensesToDelete.length}`);
        console.log(`ðŸ¢ Affected groups: ${affectedGroups.size}`);

        // Delete all expenses
        if (expensesToDelete.length > 0) {
            console.log('ðŸ”¥ Starting deletion process...');
            const deletePromises = expensesToDelete.map((doc, index) => {
                console.log(`   Deleting ${index + 1}/${expensesToDelete.length}: ${doc.id}`);
                return deleteExpense(doc.id, doc.data().groupId, doc.data().amount);
            });
            await Promise.all(deletePromises);
            console.log(`âœ… Successfully deleted ${expensesToDelete.length} expenses`);
        } else {
            console.log('âš ï¸ No expenses found to delete!');
        }

        // Reset totalExpenses for all affected groups
        if (affectedGroups.size > 0) {
            console.log('\nðŸ”„ Resetting totalExpenses for affected groups...');
            const resetPromises = Array.from(affectedGroups).map(async (groupId) => {
                const groupRef = doc(db, 'groups', groupId);
                await updateDoc(groupRef, { totalExpenses: 0 });
                console.log(`   âœ… Reset totalExpenses for group: ${groupId}`);
            });
            await Promise.all(resetPromises);
            console.log(`✅ Reset ${affectedGroups.size} group totals to ₹0`);
        }

        // Delete all user activities (using involvedUserIds to match Dashboard display)
        console.log('\nðŸ—‘ï¸ Deleting activity history...');
        const activityQuery = query(
            collection(db, 'activity'),
            where('involvedUserIds', 'array-contains', userId)
        );
        const activitySnapshot = await getDocs(activityQuery);
        const activityDeletePromises = activitySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(activityDeletePromises);
        console.log(`âœ… Deleted ${activitySnapshot.size} activity records`);

        return expensesToDelete.length;
    } catch (error) {
        console.error('âŒ Error deleting all expenses:', error);
        console.error('Error details:', error.message);
        console.error('Error code:', error.code);
        throw error;
    }
};

export const getGroupExpenses = async (groupId) => {
    try {
        const q = query(
            collection(db, 'expenses'),
            where('groupId', '==', groupId)
        );
        const querySnapshot = await getDocs(q);
        const expenses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Client-side sorting by date descending
        return expenses.sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
            return dateB - dateA;
        });
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
                expense.splitBetween?.some(split => split.userId === userId)
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
        console.log('âœ… Activity logged');
    } catch (error) {
        console.error('âŒ Error creating activity:', error);
        throw error;
    }
};

export const getUserActivity = async (userId, limitCount = 20) => {
    try {
        const q = query(
            collection(db, 'activity'),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const activities = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort client-side and limit
        return activities.sort((a, b) => {
            const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp instanceof Date ? a.timestamp.getTime() : 0);
            const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp instanceof Date ? b.timestamp.getTime() : 0);
            return timeB - timeA;
        }).slice(0, limitCount);
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

export const createSettlement = async (fromUserId, toUserId, amount, fromUserData, toUserData, groupId = null) => {
    try {
        const settlement = {
            fromUserId,
            fromUserName: fromUserData.displayName?.split(' ')[0] || 'User',
            fromUserPhoto: fromUserData.photoURL,
            toUserId,
            toUserName: toUserData.displayName?.split(' ')[0] || 'User',
            toUserPhoto: toUserData.photoURL,
            amount,
            groupId, // Store groupId if provided
            status: 'pending',
            createdAt: serverTimestamp(),
            approvedAt: null,
            note: null
        };

        const docRef = await addDoc(collection(db, 'settlements'), settlement);
        console.log('âœ… Settlement created:', docRef.id);

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
        console.error('âŒ Error creating settlement:', error);
        throw error;
    }
};

export const approveSettlement = async (settlementId) => {
    try {
        const settlementRef = doc(db, 'settlements', settlementId);
        const settlementSnap = await getDoc(settlementRef);
        const settlementData = settlementSnap.data();

        if (!settlementData) throw new Error('Settlement not found');

        // 1. Update settlement status
        await updateDoc(settlementRef, {
            status: 'approved',
            approvedAt: serverTimestamp()
        });

        // 2. Create an offsetting expense record so the balance calculator works
        // This effectively "cancels out" the debt in the ledger
        const paymentExpense = {
            description: 'Settlement Payment',
            amount: settlementData.amount,
            paidBy: settlementData.fromUserId, // Payer paid
            paidByName: settlementData.fromUserName || 'User',
            splitBetween: [{
                userId: settlementData.toUserId, // Receiver was "paid" (so they "owe" this amount back to cancel the debt)
                amount: settlementData.amount,
                name: settlementData.toUserName
            }],
            date: serverTimestamp(),
            category: 'settlement', // Special category
            type: 'payment',        // Marker
            groupId: null,          // Personal settlement
            isSettled: false,       // MUST be false to be counted in current balance
            relatedSettlementId: settlementId
        };

        await addDoc(collection(db, 'expenses'), paymentExpense);

        console.log('âœ… Settlement approved and payment recorded:', settlementId);

        // Notify the payer
        if (settlementData) {
            // Send System Message to Group Chat (if group context exists)
            if (settlementData.groupId) {
                try {
                    await sendMessage(
                        settlementData.groupId,
                        `${settlementData.toUserName} verified a payment of ₹${settlementData.amount} from ${settlementData.fromUserName}`,
                        {
                            uid: 'SYSTEM',
                            displayName: 'System',
                            photoURL: null
                        },
                        { type: 'system' }
                    );
                } catch (msgError) {
                    console.warn('Failed to send settlement system message:', msgError);
                }
            }

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

            // Create Activity Record
            await createActivity({
                involvedUserIds: [settlementData.fromUserId, settlementData.toUserId],
                type: 'payment_verified',
                description: `${settlementData.toUserName} verified a payment of ₹${settlementData.amount}`,
                relatedId: settlementId,
                groupId: settlementData.groupId || null // Link activity to group if possible
            });
        }
    } catch (error) {
        console.error('âŒ Error approving settlement:', error);
        throw error;
    }
};

export const rejectSettlement = async (settlementId) => {
    try {
        await deleteDoc(doc(db, 'settlements', settlementId));
        console.log('âœ… Settlement rejected/deleted:', settlementId);
    } catch (error) {
        console.error('âŒ Error rejecting settlement:', error);
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

export const sendMessage = async (groupId, text, currentUser, options = {}) => {
    try {
        const messagesRef = collection(db, 'groups', groupId, 'messages');
        await addDoc(messagesRef, {
            text,
            senderId: currentUser.uid,
            senderName: currentUser.displayName?.split(' ')[0] || 'User',
            senderPhoto: currentUser.photoURL,
            timestamp: serverTimestamp(),
            type: options.type || 'text'
        });
        console.log('âœ… Message sent to group:', groupId);

        // Don't notify for system messages
        if (options.type === 'system') return;

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
        console.error('âŒ Error sending message:', error);
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
        console.log('âœ… Notification created for user:', userId);
    } catch (error) {
        console.error('âŒ Error creating notification:', error);
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
        console.error('âŒ Error marking notification as read:', error);
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
        console.log(`âœ… Marked ${snapshot.size} notifications as read`);
    } catch (error) {
        console.error('âŒ Error marking all notifications as read:', error);
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

        console.log('âœ… User avatar updated in Firestore');
    } catch (error) {
        console.error('âŒ Error updating user avatar:', error);
        throw error;
    }
};

// ==================== ADMIN FUNCTIONS ====================

/**
 * Get all users with pagination (Admin only)
 * @param {number} limitCount - Number of users to fetch
 * @param {object} lastDoc - Last document for pagination
 * @returns {Promise<{users: Array, lastVisible: object}>}
 */
export const getAllUsers = async (limitCount = 50, lastDoc = null) => {
    try {
        let q = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        if (lastDoc) {
            q = query(
                collection(db, 'users'),
                orderBy('createdAt', 'desc'),
                startAfter(lastDoc),
                limit(limitCount)
            );
        }

        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const lastVisible = snapshot.docs[snapshot.docs.length - 1];

        return { users, lastVisible };
    } catch (error) {
        console.error('âŒ Error fetching all users:', error);
        throw error;
    }
};

/**
 * Get all groups (Admin only)
 * @returns {Promise<Array>}
 */
export const getAllGroups = async () => {
    try {
        const q = query(
            collection(db, 'groups'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('âŒ Error fetching all groups:', error);
        throw error;
    }
};

/**
 * Get all expenses across platform (Admin only)
 * @returns {Promise<Array>}
 */
export const getAllExpenses = async () => {
    try {
        const q = query(
            collection(db, 'expenses'),
            orderBy('date', 'desc'),
            limit(200) // Limit to prevent performance issues
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('âŒ Error fetching all expenses:', error);
        throw error;
    }
};

/**
 * Ban a user from the platform (Admin only)
 * @param {string} userId - User ID to ban
 * @param {string} reason - Reason for ban
 */
export const banUser = async (userId, reason) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            isBanned: true,
            bannedAt: serverTimestamp(),
            bannedReason: reason
        });
        console.log('âœ… User banned successfully');
    } catch (error) {
        console.error('âŒ Error banning user:', error);
        throw error;
    }
};

/**
 * Unban a user (Admin only)
 * @param {string} userId - User ID to unban
 */
export const unbanUser = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            isBanned: false,
            bannedAt: null,
            bannedReason: null
        });
        console.log('âœ… User unbanned successfully');
    } catch (error) {
        console.error('âŒ Error unbanning user:', error);
        throw error;
    }
};

/**
 * Update user role (promote/demote admin) (Admin only)
 * @param {string} userId - User ID
 * @param {boolean} isAdmin - Whether user should be admin
 */
export const updateUserRole = async (userId, isAdmin) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            isAdmin: isAdmin
        });
        console.log(`âœ… User ${isAdmin ? 'promoted to' : 'removed from'} admin`);
    } catch (error) {
        console.error('âŒ Error updating user role:', error);
        throw error;
    }
};

/**
 * Get platform-wide statistics (Admin only)
 * @returns {Promise<object>} System stats
 */
export const getSystemStats = async () => {
    try {
        // Get counts
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const groupsSnapshot = await getDocs(collection(db, 'groups'));
        const expensesSnapshot = await getDocs(collection(db, 'expenses'));
        const settlementsSnapshot = await getDocs(collection(db, 'settlements'));

        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const groups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const settlements = settlementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Calculate stats
        const totalUsers = users.length;
        const activeUsers = users.filter(u => !u.isBanned).length;
        const bannedUsers = users.filter(u => u.isBanned).length;
        const totalGroups = groups.length;
        const activeGroups = groups.filter(g => !g.isSettled).length;
        const totalExpenses = expenses.length;

        // Calculate total money managed
        const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

        // Settlement stats
        const pendingSettlements = settlements.filter(s => s.status === 'pending').length;
        const approvedSettlements = settlements.filter(s => s.status === 'approved').length;

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUsers = users.filter(u => {
            const createdAt = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
            return createdAt > sevenDaysAgo;
        }).length;

        return {
            totalUsers,
            activeUsers,
            bannedUsers,
            totalGroups,
            activeGroups,
            totalExpenses,
            totalAmount,
            pendingSettlements,
            approvedSettlements,
            recentUsers,
            adminCount: users.filter(u => u.isAdmin).length
        };
    } catch (error) {
        console.error('âŒ Error getting system stats:', error);
        throw error;
    }
};

/**
 * Force delete a group without balance checks (Admin only)
 * @param {string} groupId - Group ID to delete
 */
export const forceDeleteGroup = async (groupId) => {
    try {
        // Delete all expenses in the group
        const expensesQuery = query(
            collection(db, 'expenses'),
            where('groupId', '==', groupId)
        );
        const expensesSnapshot = await getDocs(expensesQuery);
        await Promise.all(expensesSnapshot.docs.map(doc => deleteDoc(doc.ref)));

        // Delete all settlements in the group
        const settlementsQuery = query(
            collection(db, 'settlements'),
            where('groupId', '==', groupId)
        );
        const settlementsSnapshot = await getDocs(settlementsQuery);
        await Promise.all(settlementsSnapshot.docs.map(doc => deleteDoc(doc.ref)));

        // Delete the group
        await deleteDoc(doc(db, 'groups', groupId));

        console.log('âœ… Group force deleted successfully');
    } catch (error) {
        console.error('âŒ Error force deleting group:', error);
        throw error;
    }
};

/**
 * Delete an expense completely (Admin only)
 * @param {string} expenseId - Expense ID to delete
 */
export const adminDeleteExpense = async (expenseId) => {
    try {
        await deleteDoc(doc(db, 'expenses', expenseId));
        console.log('âœ… Expense deleted successfully');
    } catch (error) {
        console.error('âŒ Error deleting expense:', error);
        throw error;
    }
};

/**
 * Search users by name or email (Admin only)
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>}
 */
export const searchUsers = async (searchTerm) => {
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Client-side filtering (Firestore doesn't support full-text search natively)
        const filtered = users.filter(user =>
            user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered;
    } catch (error) {
        console.error('âŒ Error searching users:', error);
        throw error;
    }
};

/**
/**
 * Get user recent expense activity (Admin feature)
 * @param {string} userId - User ID
 * @param {number} limit - Number of activities to fetch
 */
export const getUserRecentExpenses = async (userId, limitCount = 20) => {
    try {
        // Get user's expenses
        const expensesQuery = query(
            collection(db, 'expenses'),
            where('paidBy', '==', userId)
        );
        const expensesSnap = await getDocs(expensesQuery);
        const activities = [];

        expensesSnap.docs.forEach(doc => {
            const data = doc.data();
            activities.push({
                type: 'expense',
                action: 'Created expense',
                description: data.description,
                amount: data.amount,
                timestamp: data.createdAt,
                id: doc.id
            });
        });

        // Client-side sort and limit
        return activities.sort((a, b) => {
            const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp instanceof Date ? a.timestamp.getTime() : 0);
            const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp instanceof Date ? b.timestamp.getTime() : 0);
            return timeB - timeA;
        }).slice(0, limitCount);
    } catch (error) {
        console.error('Error getting user recent expenses:', error);
        return [];
    }
};

/**
 * Get system health metrics (Admin dashboard)
 */
export const getSystemHealth = async () => {
    try {
        const health = {
            status: 'healthy',
            uptime: '99.9%',
            responseTime: Math.floor(Math.random() * 50) + 80, // Simulated: 80-130ms
            lastCheck: new Date().toISOString(),
            services: {
                database: 'operational',
                auth: 'operational',
                storage: 'operational'
            }
        };

        // Check recent errors (simulated - in production, you'd track these)
        const errorCount = 0; // TODO: Implement error tracking

        if (errorCount > 10) {
            health.status = 'degraded';
        }

        return health;
    } catch (error) {
        console.error('âŒ Error getting system health:', error);
        return {
            status: 'error',
            message: error.message
        };
    }
};

/**
 * Get detailed user statistics (Admin user profile)
 * @param {string} userId - User ID
 */
export const getUserStats = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();

        // Get expense stats
        const expensesQuery = query(
            collection(db, 'expenses'),
            where('paidBy', '==', userId)
        );
        const expensesSnap = await getDocs(expensesQuery);

        let totalPaid = 0;
        expensesSnap.docs.forEach(doc => {
            totalPaid += doc.data().amount || 0;
        });

        // Get groups count
        const groupsQuery = query(
            collection(db, 'groups'),
            where('memberIds', 'array-contains', userId)
        );
        const groupsSnap = await getDocs(groupsQuery);

        // Get balance
        const balance = await calculateUserNetBalance(userId);

        return {
            ...userData,
            stats: {
                totalExpenses: expensesSnap.size,
                totalPaid,
                groupsCount: groupsSnap.size,
                balance: balance.total,
                joinedDate: userData.createdAt || null,
                lastActive: userData.lastActive || null
            }
        };
    } catch (error) {
        console.error('âŒ Error getting user stats:', error);
        throw error;
    }
};

/**
 * Get all groups a user belongs to (Admin user profile)
 * Uses collection query instead of user.groups array for reliability
 * @param {string} userId - User ID
 */
export const getUserGroupsAdmin = async (userId) => {
    try {
        const groupsQuery = query(
            collection(db, 'groups'),
            where('memberIds', 'array-contains', userId)
        );
        const groupsSnap = await getDocs(groupsQuery);

        return groupsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('âŒ Error getting user groups:', error);
        throw error;
    }
};

/**
 * Get aggregated analytics data for dashboard charts
 * @returns {Promise<object>} Chart data for users, expenses, and groups
 */
/**
 * Get aggregated analytics data for dashboard charts
 * @returns {Promise<object>} Chart data for users, expenses, and groups
 */
export const getDashboardAnalytics = async () => {
    try {
        console.log('Fetching dashboard analytics...');

        // 1. Fetch data
        const [usersSnap, expensesSnap, groupsSnap] = await Promise.all([
            getDocs(query(collection(db, 'users'), orderBy('createdAt', 'asc'))),
            getDocs(query(collection(db, 'expenses'), orderBy('createdAt', 'asc'))),
            getDocs(collection(db, 'groups'))
        ]);

        // 2. Process User Growth (Last 30 days)
        const userGrowth = [];
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // Initialize map for last 30 days
        const dateMap = new Map();
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
            dateMap.set(dateStr, 0);
        }

        // Count users per day
        let runningTotal = 0;
        usersSnap.docs.forEach(doc => {
            const userData = doc.data();
            if (!userData.createdAt) return;

            const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);

            // Count total up to 30 days ago for baseline
            if (date < thirtyDaysAgo) {
                runningTotal++;
            } else {
                const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                if (dateMap.has(dateStr)) {
                    dateMap.set(dateStr, dateMap.get(dateStr) + 1);
                }
            }
        });

        // Convert map to array with cumulative total
        const sortedDates = Array.from(dateMap.keys()).reverse();
        sortedDates.forEach(date => {
            runningTotal += dateMap.get(date);
            userGrowth.push({
                date,
                users: runningTotal
            });
        });

        // 3. Process Expense Trends (Last 6 months)
        const expenseTrends = [];
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 5);

        // Initialize map for last 6 months
        const monthMap = new Map();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(today.getMonth() - i);
            const monthStr = monthNames[d.getMonth()];
            monthMap.set(monthStr, 0);
        }

        expensesSnap.docs.forEach(doc => {
            const data = doc.data();
            if (!data.createdAt || !data.amount) return;

            const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            if (date >= sixMonthsAgo) {
                const monthStr = monthNames[date.getMonth()];
                if (monthMap.has(monthStr)) {
                    monthMap.set(monthStr, monthMap.get(monthStr) + data.amount);
                }
            }
        });

        monthMap.forEach((amount, month) => {
            expenseTrends.push({
                month,
                amount
            });
        });

        // 4. Process Group Status
        let activeGroups = 0;
        let settledGroups = 0;

        groupsSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.isSettled) {
                settledGroups++;
            } else {
                activeGroups++;
            }
        });

        const groupStatus = [
            { name: 'Active', value: activeGroups, color: '#10b981' },
            { name: 'Closed', value: settledGroups, color: '#6366f1' }
        ];

        return {
            userGrowth,
            expenseTrends,
            groupStatus
        };
    } catch (error) {
        console.error('Error getting dashboard analytics:', error);
        throw error;
    }
};

// ===========================
// TRAVEL BUDGET FUNCTIONS
// ===========================

/**
 * Set or update budget for a group
 * @param {string} groupId - Group ID
 * @param {Object} budgetData - Budget configuration
 * @returns {Promise<void>}
 */
export const setBudget = async (groupId, budgetData) => {
    try {
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
            budget: {
                total: budgetData.total || 0,
                currency: budgetData.currency || 'INR',
                startDate: budgetData.startDate || null,
                endDate: budgetData.endDate || null,
                notes: budgetData.notes || ''
            },
            updatedAt: serverTimestamp()
        });
        console.log(' Budget updated for group:', groupId);
    } catch (error) {
        console.error(' Error setting budget:', error);
        throw error;
    }
};

/**
 * Get real-time budget analytics for a group
 * @param {string} groupId - Group ID
 * @returns {Promise<Object>} Budget analytics
 */
export const getBudgetAnalytics = async (groupId) => {
    try {
        // Get the group document to retrieve budget info
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            throw new Error('Group not found');
        }

        const groupData = groupSnap.data();
        const budget = groupData.budget || {};

        // If no budget is set, return empty analytics
        if (!budget.total) {
            return {
                totalBudget: 0,
                utilized: 0,
                avgDaily: 0,
                estimatedFinal: 0,
                remaining: 0,
                utilizationPercent: 0,
                daysElapsed: 0,
                totalDays: 0,
                dailySpending: []
            };
        }

        // Get all expenses for this group
        const expensesRef = collection(db, 'expenses');
        const q = query(expensesRef, where('groupId', '==', groupId));
        const expensesSnap = await getDocs(q);

        // Calculate total utilized amount and group by date
        let totalUtilized = 0;
        const spendingByDate = {};

        expensesSnap.forEach((doc) => {
            const expense = doc.data();
            const amount = expense.amount || 0;
            totalUtilized += amount;

            // Group expenses by date
            const expenseDate = expense.createdAt?.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt);
            const dateKey = expenseDate.toISOString().split('T')[0];
            spendingByDate[dateKey] = (spendingByDate[dateKey] || 0) + amount;
        });

        // Calculate days elapsed and total days
        const now = new Date();
        const startDate = budget.startDate?.toDate ? budget.startDate.toDate() : new Date(budget.startDate);
        const endDate = budget.endDate?.toDate ? budget.endDate.toDate() : new Date(budget.endDate);

        const daysElapsed = Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
        const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

        // Calculate average daily spending
        const avgDaily = totalUtilized / daysElapsed;

        // Calculate estimated final cost (project current spending rate to end date)
        const estimatedFinal = avgDaily * totalDays;

        // Calculate remaining budget
        const remaining = budget.total - totalUtilized;

        // Calculate utilization percentage
        const utilizationPercent = (totalUtilized / budget.total) * 100;

        // Generate daily spending array for chart (cumulative)
        const dailySpending = [];
        let cumulativeSpending = 0;
        for (let i = 0; i < daysElapsed; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];

            if (spendingByDate[dateKey]) {
                cumulativeSpending += spendingByDate[dateKey];
            }

            dailySpending.push({
                date: dateKey,
                amount: cumulativeSpending,
                dayNumber: i + 1
            });
        }

        return {
            totalBudget: budget.total,
            utilized: Math.round(totalUtilized),
            avgDaily: Math.round(avgDaily),
            estimatedFinal: Math.round(estimatedFinal),
            remaining: Math.round(remaining),
            utilizationPercent: Math.round(utilizationPercent),
            daysElapsed,
            totalDays,
            dailySpending,
            startDate,
            endDate
        };
    } catch (error) {
        console.error('Error getting budget analytics:', error);
        throw error;
    }
};

// ===========================
// TRIP / DESTINATION FUNCTIONS
// ===========================

/**
 * Save a trip (destination) under a group
 * @param {string} groupId - Group ID
 * @param {Object} tripData - Trip data to save
 * @returns {Promise<Object>} Created trip with ID
 */
export const saveTrip = async (groupId, tripData) => {
    try {
        const tripsRef = collection(db, 'groups', groupId, 'trips');
        const docRef = await addDoc(tripsRef, {
            ...tripData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { id: docRef.id, ...tripData };
    } catch (error) {
        console.error('Error saving trip:', error);
        throw error;
    }
};

/**
 * Get all trips for a group
 * @param {string} groupId - Group ID
 * @returns {Promise<Array>} Array of trips
 */
export const getGroupTrips = async (groupId) => {
    try {
        const tripsRef = collection(db, 'groups', groupId, 'trips');
        const q = query(tripsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting group trips:', error);
        return [];
    }
};

/**
 * Update a trip (e.g., toggle favorite)
 * @param {string} groupId - Group ID
 * @param {string} tripId - Trip document ID
 * @param {Object} updates - Fields to update
 */
export const updateTrip = async (groupId, tripId, updates) => {
    try {
        const id = String(tripId);
        const tripRef = doc(db, 'groups', groupId, 'trips', id);
        await updateDoc(tripRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        // Use warn instead of error — the caller handles the fallback (saves as new)
        console.warn('updateTrip failed (will fallback):', error.message);
        throw error;
    }
};

/**
 * Delete a trip
 * @param {string} groupId - Group ID
 * @param {string} tripId - Trip document ID
 */
export const deleteTrip = async (groupId, tripId) => {
    try {
        const id = String(tripId);
        const tripRef = doc(db, 'groups', groupId, 'trips', id);
        await deleteDoc(tripRef);
    } catch (error) {
        console.error('Error deleting trip:', error);
        throw error;
    }
};

