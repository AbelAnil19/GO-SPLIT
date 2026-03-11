import React, { forwardRef, useImperativeHandle } from 'react';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';

const TrendingUpIcon = forwardRef(({ size = 24, duration = 0.8, isAnimated = true }, ref) => {
    const controls = useAnimation();
    const shouldReduceMotion = useReducedMotion();

    useImperativeHandle(ref, () => ({
        startAnimation: async () => {
            if (!isAnimated || shouldReduceMotion) return;
            await controls.start({
                y: [0, -3, 0],
                scale: [1, 1.1, 1],
                transition: { duration, ease: "easeInOut" }
            });
        },
        stopAnimation: () => {
            controls.stop();
            controls.set({ y: 0, scale: 1 });
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
            {/* Trending line going up */}
            <motion.path
                d="M3 17L9 11L13 15L21 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
            />
            {/* Arrow pointing up */}
            <motion.path
                d="M21 13V7H15"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
            />
        </motion.svg>
    );
});

TrendingUpIcon.displayName = 'TrendingUpIcon';

export { TrendingUpIcon };
