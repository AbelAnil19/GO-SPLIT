import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from '../firebase/auth';
import { useToast } from '../context/ToastContext';
import { createUserDocument } from '../firebase/firestore';
import { EyeIcon } from '../components/icons/EyeOpenIcon';
import { EyeOffIcon } from '../components/icons/EyeCloseIcon';
import { LoaderIcon } from '../components/Loader';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSigningIn, setIsSigningIn] = useState(false);
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleGoogleSignIn = async (e) => {
        e.preventDefault();
        if (!isSigningIn) {
            setIsSigningIn(true);
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

                addToast('Successfully signed in with Google!', 'success');
                navigate('/dashboard');
            } catch (err) {
                // Handle account exists with different credential
                if (err.code === 'auth/account-exists-with-different-credential') {
                    setError(`This email is already registered with email/password. Please login with your password instead, then you can link your Google account in Settings.`);
                    addToast('Account exists. Please use email/password login.', 'error');
                } else {
                    setError(err.message);
                    addToast(err.message, 'error');
                }
                setIsSigningIn(false);
            }
        }
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleEmailSignIn = async (e) => {
        e.preventDefault();
        if (!isSigningIn) {
            setError('');

            // Validation
            if (!email || !password) {
                setError('Please fill in all fields');
                addToast('Please fill in all fields', 'error');
                return;
            }

            if (!validateEmail(email)) {
                setError('Please enter a valid email address');
                addToast('Please enter a valid email address', 'error');
                return;
            }

            if (password.length < 6) {
                setError('Password must be at least 6 characters');
                addToast('Password must be at least 6 characters', 'error');
                return;
            }

            setIsSigningIn(true);
            try {
                await doSignInWithEmailAndPassword(email, password);
                addToast('Welcome back!', 'success');
                navigate('/dashboard');
            } catch (err) {
                const errorMessage = err.message.includes('user-not-found')
                    ? 'No account found with this email'
                    : err.message.includes('wrong-password')
                        ? 'Incorrect password'
                        : err.message;
                setError(errorMessage);
                addToast(errorMessage, 'error');
                setIsSigningIn(false);
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
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Log in</h2>
                <p className="text-center text-gray-500 mb-8">
                    Don't have an account? <Link to="/register" className="text-gray-700 underline hover:text-gray-900">Sign up</Link>
                </p>

                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                <button
                    onClick={handleGoogleSignIn}
                    disabled={isSigningIn}
                    className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-full py-3 px-4 hover:bg-gray-50 transition-colors mb-6 group disabled:opacity-50 cursor-pointer"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    <span className="text-gray-700 font-medium">Continue with Google</span>
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-gray-400 text-sm">Or continue with email</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Email address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-600">Password</label>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
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
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                            <span className="text-sm text-gray-600">Remember me</span>
                        </label>
                        <Link to="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700 underline">Forget your password</Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isSigningIn}
                        className="w-full bg-[#34627B] hover:bg-[#2c5369] text-white font-bold py-3 rounded-full shadow-lg transition-transform transform active:scale-95 mt-6 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSigningIn && <LoaderIcon size={20} duration={0.8} isAnimated={false} />}
                        {isSigningIn ? 'Logging In...' : 'Log in'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
