import React, { createContext, useContext, useCallback } from 'react';

const SESSION_KEY = 'gosplit_2fa_verified_at';
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const TwoFactorContext = createContext(null);

export const TwoFactorProvider = ({ children }) => {

    /**
     * Returns true if the user has verified 2FA within the last 30 minutes.
     * Reads from sessionStorage so it survives page refreshes but NOT tab closes.
     */
    const isTrusted = useCallback(() => {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (!raw) return false;
            const verifiedAt = parseInt(raw, 10);
            return Date.now() - verifiedAt < SESSION_DURATION_MS;
        } catch {
            return false;
        }
    }, []);

    /**
     * Call this immediately after a successful 2FA verification.
     * Stamps the current timestamp into sessionStorage.
     */
    const markVerified = useCallback(() => {
        try {
            sessionStorage.setItem(SESSION_KEY, String(Date.now()));
        } catch {
            // sessionStorage not available (rare edge case), fail silently
        }
    }, []);

    /**
     * Clears the trust window. Call this on logout or when disabling 2FA.
     */
    const clearTrust = useCallback(() => {
        try {
            sessionStorage.removeItem(SESSION_KEY);
        } catch {
            // ignore
        }
    }, []);

    return (
        <TwoFactorContext.Provider value={{ isTrusted, markVerified, clearTrust }}>
            {children}
        </TwoFactorContext.Provider>
    );
};

export const useTwoFactor = () => {
    const context = useContext(TwoFactorContext);
    if (!context) {
        throw new Error('useTwoFactor must be used within a TwoFactorProvider');
    }
    return context;
};
