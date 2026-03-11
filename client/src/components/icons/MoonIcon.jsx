import { cn } from "../../lib/utils";
import { motion, useAnimation } from "framer-motion";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const MoonIcon = forwardRef(
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

        const svgVariants = {
            normal: {
                y: 0,
                scale: 1,
                opacity: 1,
            },
            animate: {
                y: [0, -2, 0],
                scale: [1, 1.04, 1],
                transition: {
                    duration: 0.8 * duration,
                    ease: "easeInOut",
                },
            },
        };

        const pathVariant = {
            normal: {
                opacity: 0.85,
            },
            animate: {
                opacity: [0.85, 1, 0.9],
                transition: {
                    duration: 0.8 * duration,
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
                    variants={svgVariants}
                >
                    <motion.path
                        d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"
                        variants={pathVariant}
                    />
                </motion.svg>
            </div>
        );
    },
);

MoonIcon.displayName = "MoonIcon";
export { MoonIcon };
