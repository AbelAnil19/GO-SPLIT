import { auth } from "./firebaseConfig";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    signOut,
    updateProfile,
    fetchSignInMethodsForEmail,
    sendEmailVerification as sendEmailVerificationEmail,
    linkWithCredential,
} from "firebase/auth";

export const doCreateUserWithEmailAndPassword = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const doSignInWithEmailAndPassword = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const doSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        return result;
    } catch (error) {
        // Check if account exists with different credential
        if (error.code === 'auth/account-exists-with-different-credential') {
            // Get the email from the error
            const email = error.customData.email;
            // Get the pending credential
            const pendingCred = GoogleAuthProvider.credentialFromError(error);

            // Return error with linking info
            throw {
                code: 'auth/account-exists-with-different-credential',
                email: email,
                pendingCredential: pendingCred,
                message: `An account already exists with ${email}. Please sign in with your password first, then link your Google account in settings.`
            };
        }
        throw error;
    }
};

export const linkGoogleAccount = async (user, credential) => {
    try {
        const result = await linkWithCredential(user, credential);
        console.log('✅ Google account linked successfully');
        return result;
    } catch (error) {
        console.error('❌ Error linking Google account:', error);
        throw error;
    }
};

export const doSignOut = async () => {
    return signOut(auth);
};

export const doPasswordReset = async (email) => {
    return sendPasswordResetEmail(auth, email);
};

export const checkEmailExists = async (email) => {
    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        return methods.length > 0; // Returns true if email is already registered
    } catch (error) {
        console.error('Error checking email:', error);
        return false;
    }
};

export const sendEmailVerification = async (user) => {
    try {
        await sendEmailVerificationEmail(user);
        console.log('✅ Verification email sent');
    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        throw error;
    }
};

export const checkIfEmailVerified = async () => {
    const user = auth.currentUser;
    if (user) {
        await user.reload(); // Refresh user data
        return user.emailVerified;
    }
    return false;
};

export const doUpdateProfile = async (user, displayName, photoURL) => {
    return updateProfile(user, { displayName, photoURL });
};
