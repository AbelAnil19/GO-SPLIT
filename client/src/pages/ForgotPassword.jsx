import { Link } from 'react-router-dom';
import { useState } from 'react';
import { doPasswordReset } from '../firebase/auth';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const { addToast } = useToast();

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleReset = async (e) => {
        e.preventDefault();
        setIsSending(true);
        setError('');
        setMessage('');

        // Client-side validation before hitting Firebase
        if (!email.trim()) {
            setError('Please enter your email address.');
            setIsSending(false);
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address (e.g. name@example.com).');
            setIsSending(false);
            return;
        }

        try {
            await doPasswordReset(email);
            const msg = 'Password reset email sent! Check your inbox.';
            setMessage(msg);
            addToast(msg, 'success');
            setIsSending(false);
        } catch (err) {
            // Map Firebase error codes to friendly messages
            let friendlyMessage = 'Something went wrong. Please try again.';
            if (err.code === 'auth/user-not-found') {
                friendlyMessage = 'No account found with this email address.';
            } else if (err.code === 'auth/too-many-requests') {
                friendlyMessage = 'Too many attempts. Please wait a moment and try again.';
            } else if (err.code === 'auth/network-request-failed') {
                friendlyMessage = 'Network error. Please check your connection.';
            } else if (err.code === 'auth/invalid-email') {
                friendlyMessage = 'The email address is invalid.';
            }
            setError(friendlyMessage);
            addToast(friendlyMessage, 'error');
            setIsSending(false);
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
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Reset Password</h2>
                <p className="text-center text-gray-500 mb-8">
                    Enter your email address to receive password reset instructions.
                </p>

                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                {message && <p className="text-green-500 text-sm text-center mb-4">{message}</p>}

                <form onSubmit={handleReset} className="space-y-6">
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

                    <button
                        type="submit"
                        disabled={isSending}
                        className="w-full bg-[#34627B] hover:bg-[#2c5369] text-white font-bold py-3 rounded-full shadow-lg transition-transform transform active:scale-95 disabled:opacity-50"
                    >
                        {isSending ? 'Sending...' : 'Reset Password'}
                    </button>

                    <div className="text-center mt-4">
                        <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700 underline">Back to Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
