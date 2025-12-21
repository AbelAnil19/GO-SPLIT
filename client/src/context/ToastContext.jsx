import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed top-24 right-4 z-50 flex flex-col gap-4">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            min-w-[300px] p-4 rounded-lg shadow-lg backdrop-blur-md border border-white/10
                            transform transition-all duration-300 ease-in-out animate-fade-in-up
                            ${toast.type === 'success' ? 'bg-green-500/20 text-green-200 border-green-500/30' : ''}
                            ${toast.type === 'error' ? 'bg-red-500/20 text-red-200 border-red-500/30' : ''}
                            ${toast.type === 'info' ? 'bg-blue-500/20 text-blue-200 border-blue-500/30' : ''}
                        `}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-medium mr-4">{toast.message}</span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-white/50 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        {/* Progress bar animation could go here */}
                        <div className={`h-1 w-full mt-3 rounded-full overflow-hidden bg-black/20`}>
                            <div className={`h-full animate-[shimmer_5s_linear_forwards] w-full origin-left
                                ${toast.type === 'success' ? 'bg-green-500' : ''}
                                ${toast.type === 'error' ? 'bg-red-500' : ''}
                                ${toast.type === 'info' ? 'bg-blue-500' : ''}
                             `}></div>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
