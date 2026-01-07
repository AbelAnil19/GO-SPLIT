import { cn } from "../../lib/utils";
import { motion, useAnimation } from "framer-motion";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const SunIcon = forwardRef(
    (
        {
            onMouseEnter,
            onMouseLeave,
            className,
            size = 24,
            duration = 1,
            isAnimated = true,
            ...props
        },
        ref,
    ) => {
        const controls = useAnimation();
        const isControlled = useRef(false);

        useImperativeHandle(ref, () => {
            isControlled.current = true;
            return {
                startAnimation: () => controls.start("animate"),
                stopAnimation: () => controls.start("normal"),
            };
        });

        const handleEnter = useCallback(
            (e) => {
                if (!isAnimated) return;
                if (!isControlled.current) controls.start("animate");
                else onMouseEnter?.(e);
            },
            [controls, isAnimated, onMouseEnter],
        );

        const handleLeave = useCallback(
            (e) => {
                if (!isControlled.current) {
                    controls.start("normal");
                } else {
                    onMouseLeave?.(e);
                }
            },
            [controls, onMouseLeave],
        );

        const svgVariant = {
            normal: { rotate: 0 },
            animate: {
                rotate: 12,
                transition: {
                    duration,
                    ease: [0.22, 1, 0.36, 1],
                },
            },
        };

        const centerVariant = {
            normal: { scale: 1 },
            animate: {
                scale: [1, 1.18, 1],
                transition: {
                    duration,
                    ease: "easeInOut",
                },
            },
        };

        const rayVariant = {
            normal: { opacity: 1 },
            animate: {
                opacity: [1, 0.7, 1],
                transition: {
                    duration,
                    ease: "easeInOut",
                },
            },
        };

        return (
            <div
                className={cn("inline-flex items-center justify-center", className)}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                {...props}
            >
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={controls}
                    initial="normal"
                    variants={svgVariant}
                >
                    <motion.circle cx="12" cy="12" r="4" variants={centerVariant} />
                    <motion.path d="M12 2v2" variants={rayVariant} />
                    <motion.path d="M12 20v2" variants={rayVariant} />
                    <motion.path d="m4.93 4.93 1.41 1.41" variants={rayVariant} />
                    <motion.path d="m17.66 17.66 1.41 1.41" variants={rayVariant} />
                    <motion.path d="M2 12h2" variants={rayVariant} />
                    <motion.path d="M20 12h2" variants={rayVariant} />
                    <motion.path d="m6.34 17.66-1.41 1.41" variants={rayVariant} />
                    <motion.path d="m19.07 4.93-1.41 1.41" variants={rayVariant} />
                </motion.svg>
            </div>
        );
    },
);

SunIcon.displayName = "SunIcon";
export { SunIcon };
