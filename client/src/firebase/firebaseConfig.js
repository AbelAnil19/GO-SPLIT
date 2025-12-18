// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// TODO: Replace with your project's config object
const firebaseConfig = {
    apiKey: "AIzaSyD_Dz9oDjS7_okCBEyZJEFqRs1-DZhn5CE",
    authDomain: "gosplit-5111a.firebaseapp.com",
    projectId: "gosplit-5111a",
    storageBucket: "gosplit-5111a.firebasestorage.app",
    messagingSenderId: "906692361516",
    appId: "1:906692361516:web:90418d58113fb739294089"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
