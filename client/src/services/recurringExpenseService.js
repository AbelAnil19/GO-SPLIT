// Recurring Expense Auto-Creation Service
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { calculateSplit } from '../utils/expenseCalculator';

/**
 * Check and create due recurring expenses
 * Call this on app load or periodically
 */
export const processRecurringExpenses = async (userId) => {
    try {
        const recurringRef = collection(db, 'recurringExpenses');
        const q = query(
            recurringRef,
            where('createdBy', '==', userId),
            where('isActive', '==', true)
        );

        const snapshot = await getDocs(q);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const docSnapshot of snapshot.docs) {
            const template = { id: docSnapshot.id, ...docSnapshot.data() };

            const nextDate = template.nextCreationDate
                ? new Date(template.nextCreationDate)
                : new Date(template.startDate);
            nextDate.setHours(0, 0, 0, 0);

            // Check if end date has passed
            if (template.endDate) {
                const endDate = new Date(template.endDate);
                if (today > endDate) {
                    // Deactivate if past end date
                    await updateDoc(doc(db, 'recurringExpenses', template.id), {
                        isActive: false
                    });
                    continue;
                }
            }

            // Check if expense is due
            if (nextDate <= today) {
                await createExpenseFromTemplate(template);

                // Calculate next creation date
                const newNextDate = calculateNextDate(today, template.frequency);
                await updateDoc(doc(db, 'recurringExpenses', template.id), {
                    nextCreationDate: newNextDate.toISOString(),
                    lastCreatedAt: new Date().toISOString()
                });
            }
        }

    } catch (error) {
        console.error('Error processing recurring expenses:', error);
    }
};

/**
 * Create an expense from a recurring template
 */
const createExpenseFromTemplate = async (template) => {
    try {
        // Calculate splits
        const splits = calculateSplit(template.amount, template.splitWith);

        const expense = {
            description: template.description,
            amount: template.amount,
            currency: template.currency || 'INR',
            category: template.category,
            groupId: template.groupId,
            groupName: template.groupName,
            paidBy: template.paidBy,
            splits,
            createdBy: template.createdBy,
            createdAt: new Date().toISOString(),
            isRecurring: true,
            recurringTemplateId: template.id
        };

        await addDoc(collection(db, 'expenses'), expense);
        console.log('Created recurring expense:', expense.description);

    } catch (error) {
        console.error('Error creating expense from template:', error);
        throw error;
    }
};

/**
 * Calculate the next occurrence date based on frequency
 */
const calculateNextDate = (currentDate, frequency) => {
    const next = new Date(currentDate);

    switch (frequency) {
        case 'daily':
            next.setDate(next.getDate() + 1);
            break;
        case 'weekly':
            next.setDate(next.getDate() + 7);
            break;
        case 'monthly':
            next.setMonth(next.getMonth() + 1);
            break;
        case 'yearly':
            next.setFullYear(next.getFullYear() + 1);
            break;
        default:
            next.setMonth(next.getMonth() + 1); // Default to monthly
    }

    return next;
};

/**
 * Create a new recurring expense template
 */
export const createRecurringTemplate = async (templateData) => {
    try {
        // Calculate first next creation date
        const nextCreationDate = new Date(templateData.startDate);

        const template = {
            ...templateData,
            nextCreationDate: nextCreationDate.toISOString(),
            lastCreatedAt: null,
            isActive: true,
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'recurringExpenses'), template);
        return docRef.id;

    } catch (error) {
        console.error('Error creating recurring template:', error);
        throw error;
    }
};

/**
 * Get all recurring templates for a user
 */
export const getUserRecurringTemplates = async (userId) => {
    try {
        const recurringRef = collection(db, 'recurringExpenses');
        const q = query(
            recurringRef,
            where('createdBy', '==', userId)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } catch (error) {
        console.error('Error fetching recurring templates:', error);
        return [];
    }
};

/**
 * Pause/Resume a recurring template
 */
export const toggleRecurringTemplate = async (templateId, isActive) => {
    try {
        await updateDoc(doc(db, 'recurringExpenses', templateId), {
            isActive
        });
    } catch (error) {
        console.error('Error toggling recurring template:', error);
        throw error;
    }
};

/**
 * Delete a recurring template
 */
export const deleteRecurringTemplate = async (templateId) => {
    try {
        await updateDoc(doc(db, 'recurringExpenses', templateId), {
            isActive: false,
            deletedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error deleting recurring template:', error);
        throw error;
    }
};
