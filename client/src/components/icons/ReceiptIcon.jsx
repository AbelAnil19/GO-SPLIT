import { cn } from "../../lib/utils";
import { motion, useAnimation } from "framer-motion";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const ReceiptIcon = forwardRef(
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

        const paperVariants = {
            normal: { pathLength: 1, opacity: 1, y: 0 },
            animate: {
                y: [0, -2, 0],
                transition: {
                    duration: 0.5 * duration,
                    ease: "easeInOut",
                    times: [0, 0.5, 1]
                }
            }
        };

        const lineVariants = {
            normal: { pathLength: 1, opacity: 0.5 },
            animate: (custom) => ({
                pathLength: [0, 1],
                opacity: [0, 1],
                transition: {
                    duration: 0.4 * duration,
                    ease: "easeOut",
                    delay: 0.1 + (custom * 0.1)
                }
            })
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
                    <motion.path
                        d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"
                        variants={paperVariants}
                        initial="normal"
                        animate={controls}
                    />
                    <motion.path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"
                        variants={lineVariants} custom={0} initial="normal" animate={controls}
                    />
                    <motion.path d="M12 17V7"
                        variants={lineVariants} custom={1} initial="normal" animate={controls}
                    />
                </motion.svg>
            </div>
        );
    },
);

ReceiptIcon.displayName = "ReceiptIcon";
export { ReceiptIcon };
