import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from '../firebase/auth';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSigningIn, setIsSigningIn] = useState(false);
    const navigate = useNavigate();

    const handleGoogleSignIn = async (e) => {
        e.preventDefault();
        if (!isSigningIn) {
            setIsSigningIn(true);
            setError('');
            try {
                await doSignInWithGoogle();
                navigate('/home');
            } catch (err) {
                setError(err.message);
                setIsSigningIn(false);
            }
        }
    };

    const handleEmailSignIn = async (e) => {
        e.preventDefault();
        if (!isSigningIn) {
            setIsSigningIn(true);
            setError('');
            try {
                await doSignInWithEmailAndPassword(email, password);
                navigate('/home');
            } catch (err) {
                setError(err.message);
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
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        />
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
                        className="w-full bg-[#34627B] hover:bg-[#2c5369] text-white font-bold py-3 rounded-full shadow-lg transition-transform transform active:scale-95 mt-6 disabled:opacity-50"
                    >
                        {isSigningIn ? 'Logging In...' : 'Log in'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
