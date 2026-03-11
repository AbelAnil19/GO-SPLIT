import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [theme, setTheme] = useState('dark');
    const [loading, setLoading] = useState(true);

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle('light', savedTheme === 'light');
        }
        setLoading(false);
    }, []);

    // Update localStorage and document class when theme changes
    useEffect(() => {
        if (!loading) {
            localStorage.setItem('theme', theme);

            // Remove both classes first
            document.documentElement.classList.remove('light', 'dark');

            // Add the current theme class
            if (theme === 'light') {
                document.documentElement.classList.add('light');
            } else {
                document.documentElement.classList.add('dark');
            }

            console.log('Theme applied:', theme, 'Classes:', document.documentElement.className);
        }
    }, [theme, loading]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const setThemePreference = async (newTheme) => {
        setTheme(newTheme);

        // Save to Firestore if user is logged in
        if (currentUser) {
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                await updateDoc(userRef, {
                    'settings.theme': newTheme
                });
            } catch (error) {
                console.error('Error saving theme preference:', error);
            }
        }
    };

    const value = {
        theme,
        toggleTheme,
        setThemePreference,
        isDark: theme === 'dark',
        isLight: theme === 'light'
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
