import React, { forwardRef, useImperativeHandle } from 'react';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';

const WalletIcon = forwardRef(({ size = 24, duration = 0.8, isAnimated = true }, ref) => {
    const controls = useAnimation();
    const shouldReduceMotion = useReducedMotion();

    useImperativeHandle(ref, () => ({
        startAnimation: async () => {
            if (!isAnimated || shouldReduceMotion) return;
            await controls.start({
                scale: [1, 1.2, 1],
                rotate: [0, -5, 5, 0],
                transition: { duration, ease: "easeInOut" }
            });
        },
        stopAnimation: () => {
            controls.stop();
            controls.set({ scale: 1, rotate: 0 });
        }
    }));

    return (
        <motion.svg
            animate={controls}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Wallet body */}
            <motion.path
                d="M21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V8M21 8V6C21 4.89543 20.1046 4 19 4H5C3.89543 4 3 4.89543 3 6V8M21 8H3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
            />
            {/* Card slot */}
            <motion.rect
                x="16"
                y="12"
                width="3"
                height="4"
                rx="0.5"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
            />
        </motion.svg>
    );
});

WalletIcon.displayName = 'WalletIcon';

export { WalletIcon };
