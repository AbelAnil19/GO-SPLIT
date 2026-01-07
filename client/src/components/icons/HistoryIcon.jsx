import { cn } from "../../lib/utils";
import { motion, useAnimation } from "framer-motion";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const HistoryIcon = forwardRef(
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
                if (!isControlled.current) controls.start("normal");
                else onMouseLeave?.(e);
            },
            [controls, onMouseLeave],
        );

        const handVariants = (rot) => ({
            normal: { rotate: rot, transition: { duration: 0.3 } },
            animate: {
                rotate: rot + 360,
                transition: {
                    duration: 1.5 * duration,
                    ease: "linear",
                    repeat: Infinity
                }
            }
        });

        const hourHandVariants = {
            normal: { rotate: 0 },
            animate: {
                rotate: 360,
                transition: {
                    duration: 4 * duration,
                    ease: "linear",
                    repeat: Infinity
                }
            }
        };

        const minuteHandVariants = {
            normal: { rotate: 0 },
            animate: {
                rotate: 360,
                transition: {
                    duration: 1 * duration,
                    ease: "linear",
                    repeat: Infinity
                }
            }
        };

        const arrowVariants = {
            normal: { opacity: 0, pathLength: 0 },
            animate: {
                opacity: 1,
                pathLength: 1,
                transition: {
                    duration: 0.6 * duration,
                    ease: "easeInOut"
                }
            }
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
                >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <motion.g
                        initial={{ rotate: 0, originX: "12px", originY: "12px" }}
                    >
                        {/* Hour Hand */}
                        <motion.line
                            x1="12" y1="12" x2="12" y2="8"
                            initial="normal"
                            animate={controls}
                            variants={hourHandVariants}
                            style={{ originX: 0.5, originY: 1 }} // Pivot at bottom
                        />
                        {/* Minute Hand */}
                        <motion.line
                            x1="12" y1="12" x2="16" y2="12"
                            initial="normal"
                            animate={controls}
                            variants={minuteHandVariants}
                            style={{ originX: 0, originY: 0.5 }} // Pivot at left
                        />
                    </motion.g>
                </motion.svg>
            </div>
        );
    },
);

HistoryIcon.displayName = "HistoryIcon";
export { HistoryIcon };
