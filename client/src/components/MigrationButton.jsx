import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import React, { useState } from 'react';
import { useAuth } from '../firebase/authContext';

const MigrationButton = () => {
    const { currentUser } = useAuth();
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const runMigration = async () => {
        setLoading(true);
        setStatus('Starting migration...');
        try {
            // Updated query: Only fetch groups created by YOU to pass security rules
            const groupsRef = collection(db, 'groups');
            const q = query(groupsRef, where('createdBy', '==', currentUser.uid));
            const snapshot = await getDocs(q);

            let updatedCount = 0;

            const updates = snapshot.docs.map(async (groupDoc) => {
                const data = groupDoc.data();

                // Check if memberIds field is missing
                if (!data.memberIds && data.members) {
                    const memberIds = data.members.map(m => m.userId);
                    const groupRef = doc(db, 'groups', groupDoc.id);

                    await updateDoc(groupRef, {
                        memberIds: memberIds
                    });
                    updatedCount++;
                }
            });

            await Promise.all(updates);

            setStatus(`Migration complete! Updated ${updatedCount} groups. Refresh the page.`);
        } catch (error) {
            console.error(error);
            setStatus(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Database Migration</h3>
            <p className="text-sm mb-3 text-gray-500 dark:text-gray-400">Add memberIds to old groups</p>
            <button
                onClick={runMigration}
                disabled={loading}
                className="bg-amber-400 hover:bg-amber-500 text-black font-bold py-2 px-4 rounded w-full disabled:opacity-50"
            >
                {loading ? 'Migrating...' : 'Run Fix'}
            </button>
            {status && <p className="mt-2 text-xs font-mono text-green-600 dark:text-green-400">{status}</p>}
        </div>
    );
};

export default MigrationButton;
