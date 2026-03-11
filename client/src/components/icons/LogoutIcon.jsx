import { cn } from "../../lib/utils";
import { motion, useAnimation } from "framer-motion";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const LogoutIcon = forwardRef(
    (
        {
            onMouseEnter,
            onMouseLeave,
            className,
            size = 28,
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
                if (!isControlled.current) controls.start("normal");
                else onMouseLeave?.(e);
            },
            [controls, onMouseLeave],
        );

        const iconVariants = {
            normal: { scale: 1, rotate: 0 },
            animate: {
                scale: [1, 1.1, 0.95, 1],
                rotate: [0, 3, -2, 0],
                transition: {
                    duration: 0.9 * duration,
                    ease: "easeInOut",
                },
            },
        };

        const arrowVariants = {
            normal: { x: 0, opacity: 1 },
            animate: {
                x: [8, -2, 0],
                opacity: [0, 1, 1],
                transition: {
                    duration: 0.6 * duration,
                    ease: "easeOut",
                },
            },
        };

        const doorVariants = {
            normal: { pathLength: 1 },
            animate: {
                pathLength: [0, 1],
                transition: {
                    duration: 0.7 * duration,
                    ease: "easeInOut",
                    delay: 0.1,
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
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={controls}
                    initial="normal"
                    variants={iconVariants}
                >
                    <motion.path d="m16 17 5-5-5-5" variants={arrowVariants} />
                    <motion.path d="M21 12H9" variants={arrowVariants} />

                    <motion.path
                        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                        variants={doorVariants}
                    />
                </motion.svg>
            </div>
        );
    },
);

LogoutIcon.displayName = "LogoutIcon";
export { LogoutIcon };
