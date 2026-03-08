import { useEffect, useState, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../firebase/authContext';

export const useExpenseNotifications = () => {
    const { currentUser } = useAuth();
    const [preferences, setPreferences] = useState({ notifExpense: false });

    // Use a ref to store initialization time so we only alert on NEW expenses
    const initTimeRef = useRef(Timestamp.now());

    useEffect(() => {
        if (!currentUser) return;

        // 1. Fetch user's notification preferences
        const fetchPreferences = async () => {
            const { getUserDocument } = await import('../firebase/firestore');
            const doc = await getUserDocument(currentUser.uid);
            if (doc && doc.notifExpense) {
                setPreferences({ notifExpense: true });
                // If enabled but permission hasn't been granted, request it silently
                if (Notification.permission === 'default') {
                    Notification.requestPermission();
                }
            }
        };
        fetchPreferences();

    }, [currentUser]);

    useEffect(() => {
        // Only run listener if user wants notifications and browser allows them
        if (!currentUser || !preferences.notifExpense || Notification.permission !== 'granted') return;

        const expensesRef = collection(db, 'expenses');

        // Listen to ALL expenses (we will filter by group later)
        // Note: In a massive app, you would query by `groupId in userGroups`, 
        // but Firestore 'in' queries are limited to 10 items.
        // For GoSplit, we listen to recent expenses and filter on the client.
        const q = query(
            expensesRef,
            where('createdAt', '>=', initTimeRef.current.toDate().toISOString()),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const expense = { id: change.doc.id, ...change.doc.data() };

                    // Don't notify the user about their OWN expenses
                    if (expense.createdBy === currentUser.uid) return;

                    // Deduplication system (Prevent double-firing)
                    const notifiedExpenses = JSON.parse(localStorage.getItem('notifiedExpenses') || '[]');
                    if (notifiedExpenses.includes(expense.id)) return; // Already alerted

                    // Verify the user is actually in this expense's split list
                    const isUserInvolved = expense.splits?.some(s => s.userId === currentUser.uid);
                    if (!isUserInvolved) return; // Not their bill

                    // Send the Desktop Notification!
                    new Notification("GoSplit 💸", {
                        body: `${expense.paidByName || 'Someone'} added an expense for ${expense.currency || 'INR'} ${expense.amount}: ${expense.description}`,
                        icon: '/vite.svg'
                    });

                    // Save ID to prevent duplicates
                    notifiedExpenses.push(expense.id);

                    // Keep local storage clean (only keep last 50)
                    if (notifiedExpenses.length > 50) notifiedExpenses.shift();
                    localStorage.setItem('notifiedExpenses', JSON.stringify(notifiedExpenses));
                }
            });
        });

        return () => unsubscribe();
    }, [currentUser, preferences.notifExpense]);

    return preferences;
};
