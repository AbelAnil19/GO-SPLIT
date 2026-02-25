import React, { forwardRef, useImperativeHandle } from 'react';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';
import { useCurrency } from '../../context/CurrencyContext';

const PaymentsIcon = forwardRef(({ size = 24, duration = 0.8, isAnimated = true }, ref) => {
    const { currencySymbol } = useCurrency();
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
            {/* Money bills stack */}
            <motion.rect
                x="2"
                y="6"
                width="20"
                height="12"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            />
            <motion.circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
            />
            {/* Currency symbol */}
            <motion.text
                x="12"
                y="14"
                fontSize="8"
                fill="currentColor"
                textAnchor="middle"
                fontWeight="bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
            >
                {currencySymbol}
            </motion.text>
        </motion.svg>
    );
});

PaymentsIcon.displayName = 'PaymentsIcon';

export { PaymentsIcon };
