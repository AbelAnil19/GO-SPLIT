import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { doCreateUserWithEmailAndPassword, doSignInWithGoogle, doUpdateProfile, checkEmailExists, sendEmailVerification } from '../firebase/auth';
import { useToast } from '../context/ToastContext';
import { createUserDocument } from '../firebase/firestore';
import { EyeIcon } from '../components/icons/EyeOpenIcon';
import { EyeOffIcon } from '../components/icons/EyeCloseIcon';
import { LoaderIcon } from '../components/Loader';
import MinimalToast from '../components/ui/MinimalToast';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const { addToast } = useToast();
    const navigate = useNavigate();

    // Live validation errors
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // MinimalToast state for validation
    const [validationToast, setValidationToast] = useState({
        open: false,
        message: '',
        type: 'error'
    });

    const showValidationError = (message) => {
        setValidationToast({
            open: true,
            message,
            type: 'error'
        });
        setTimeout(() => {
            setValidationToast(prev => ({ ...prev, open: false }));
        }, 3000);
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        return password.length >= 6;
    };

    // Live validation handlers
    const handleNameChange = (e) => {
        const value = e.target.value;
        // Only allow letters and spaces
        const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
        setName(cleanValue);

        if (cleanValue && cleanValue.trim().length < 2) {
            setErrors(prev => ({ ...prev, name: 'Name must be at least 2 characters' }));
        } else if (cleanValue && !/^[a-zA-Z\s]+$/.test(cleanValue)) {
            setErrors(prev => ({ ...prev, name: 'Name can only contain letters and spaces' }));
        } else {
            setErrors(prev => ({ ...prev, name: '' }));
        }
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);

        if (value && !validateEmail(value)) {
            setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
        } else {
            setErrors(prev => ({ ...prev, email: '' }));
        }
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);

        if (value && value.length < 6) {
            setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
        } else {
            setErrors(prev => ({ ...prev, password: '' }));
        }

        // Also check confirm password match if it exists
        if (confirmPassword && value !== confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        } else if (confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
    };

    const handleConfirmPasswordChange = (e) => {
        const value = e.target.value;
        setConfirmPassword(value);

        if (value && value !== password) {
            setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        } else {
            setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            showValidationError('Please fill in all fields');
            return;
        }

        if (name.trim().length < 2) {
            showValidationError('Name must be at least 2 characters');
            return;
        }

        if (!validateEmail(email)) {
            showValidationError('Please enter a valid email address');
            return;
        }

        if (!validatePassword(password)) {
            showValidationError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            showValidationError("Passwords do not match");
            return;
        }

        // Check if email already exists in Firebase Auth
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
            showValidationError('This email is already registered. Please login instead.');
            return;
        }

        if (!isRegistering) {
            setIsRegistering(true);
            try {
                const userCredential = await doCreateUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Update profile with name and generated avatar
                const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
                await doUpdateProfile(user, name, photoURL);

                // Create user document in Firestore
                await createUserDocument(user.uid, {
                    displayName: name,
                    email: user.email,
                    photoURL: photoURL
                });

                // Send email verification
                await sendEmailVerification(user);

                // Navigate to verify-email (toast will be shown by DashboardLayout)
                navigate('/verify-email');
            } catch (err) {
                const errorMessage = err.message.includes('email-already-in-use')
                    ? 'This email is already registered'
                    : err.message.includes('weak-password')
                        ? 'Password is too weak'
                        : err.message;
                setError(errorMessage);
                addToast(errorMessage, 'error');
                setIsRegistering(false);
            }
        }
    };

    const handleGoogleSignIn = async (e) => {
        e.preventDefault();
        if (!isRegistering) {
            setIsRegistering(true);
            setError('');
            try {
                const result = await doSignInWithGoogle();
                const user = result.user;

                // Create or update user document in Firestore
                await createUserDocument(user.uid, {
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL
                });

                addToast('Successfully signed up with Google!', 'success');
                navigate('/dashboard');
            } catch (err) {
                setError(err.message);
                addToast(err.message, 'error');
                setIsRegistering(false);
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
            <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-2xl w-full max-w-md mx-4 relative">
                <Link to="/" className="absolute top-4 right-6 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </Link>
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Create Account</h2>
                <p className="text-center text-gray-500 mb-8">
                    Already have an account? <Link to="/login" className="text-gray-700 underline hover:text-gray-900">Log in</Link>
                </p>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={isRegistering}
                    className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-full py-3 px-4 hover:bg-gray-50 transition-colors mb-6 group disabled:opacity-50 cursor-pointer"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    <span className="text-gray-700 font-medium">Sign up with Google</span>
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-gray-400 text-sm">Or sign up with email</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={handleNameChange}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all`}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                                {errors.name}
                            </p>
                        )}
                        {!errors.name && name && (
                            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                                Valid name
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Email address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={handleEmailChange}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all`}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                                {errors.email}
                            </p>
                        )}
                        {!errors.email && email && validateEmail(email) && (
                            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                                Valid email
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={handlePasswordChange}
                                className={`w-full px-4 py-3 pr-12 rounded-xl border ${errors.password ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? (
                                    <EyeIcon size={20} duration={0.5} />
                                ) : (
                                    <EyeOffIcon size={20} duration={0.5} />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                                {errors.password}
                            </p>
                        )}
                        {!errors.password && password && password.length >= 6 && (
                            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                                Strong password
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                className={`w-full px-4 py-3 pr-12 rounded-xl border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showConfirmPassword ? (
                                    <EyeIcon size={20} duration={0.5} />
                                ) : (
                                    <EyeOffIcon size={20} duration={0.5} />
                                )}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                                {errors.confirmPassword}
                            </p>
                        )}
                        {!errors.confirmPassword && confirmPassword && confirmPassword === password && (
                            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                                Passwords match
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isRegistering}
                        className="w-full bg-[#34627B] hover:bg-[#2c5369] text-white font-bold py-3 rounded-full shadow-lg transition-transform transform active:scale-95 mt-6 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isRegistering && <LoaderIcon size={20} duration={0.8} isAnimated={false} />}
                        {isRegistering ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>
            </div>

            {/* Validation Toast */}
            <MinimalToast
                open={validationToast.open}
                onClose={() => setValidationToast(prev => ({ ...prev, open: false }))}
                message={validationToast.message}
                type={validationToast.type}
            />
        </div>
    );
};

export default RegisterPage;

