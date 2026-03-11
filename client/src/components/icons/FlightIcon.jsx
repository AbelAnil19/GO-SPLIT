import { cn } from "../../lib/utils";
import { motion, useAnimation } from "framer-motion";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const FlightIcon = forwardRef(
    (
        {
            onMouseEnter,
            onMouseLeave,
            className,
            size = 24,
            duration = 0.6,
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

        const planeVariants = {
            normal: {
                x: 0,
                y: 0,
                rotate: 45, // Point diagonal for takeoff look
                scale: 1,
            },
            animate: {
                x: [0, 6, 0],
                y: [0, -6, 0],
                rotate: [45, 55, 45],
                scale: [1, 1.1, 1],
                transition: {
                    duration: duration,
                    ease: "easeInOut",
                    times: [0, 0.5, 1]
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
                    fill="currentColor"
                    stroke="none"
                    animate={controls}
                >
                    <motion.path
                        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                        variants={planeVariants}
                        initial="normal"
                        animate={controls}
                    />
                </motion.svg>
            </div>
        );
    },
);

FlightIcon.displayName = "FlightIcon";
export { FlightIcon };
