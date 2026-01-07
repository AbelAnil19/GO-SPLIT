import { cn } from "../../lib/utils";
import { motion, useAnimation } from "framer-motion";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const EyeOffIcon = forwardRef(
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
        const arcControls = useAnimation();
        const slashControls = useAnimation();
        const isControlled = useRef(false);

        useImperativeHandle(ref, () => {
            isControlled.current = true;
            return {
                startAnimation: () => {
                    arcControls.start("hide");
                    slashControls.start("strike");
                },
                stopAnimation: () => {
                    arcControls.start("visible");
                    slashControls.start("visible");
                },
            };
        });

        const handleEnter = useCallback(
            (e) => {
                if (!isAnimated) return;
                if (!isControlled.current) {
                    arcControls.start("hide");
                    slashControls.start("strike");
                } else onMouseEnter?.(e);
            },
            [arcControls, slashControls, isAnimated, onMouseEnter],
        );

        const handleLeave = useCallback(
            (e) => {
                if (!isControlled.current) {
                    arcControls.start("visible");
                    slashControls.start("visible");
                } else onMouseLeave?.(e);
            },
            [arcControls, slashControls, onMouseLeave],
        );

        const arcVariants = {
            visible: {
                opacity: 1,
                scale: 1,
            },
            hide: {
                opacity: 0.4,
                scale: 0.92,
                transition: {
                    duration: 0.25 * duration,
                    ease: "easeOut",
                },
            },
        };

        const slashVariants = {
            visible: {
                pathLength: 1,
                opacity: 1,
            },
            strike: {
                pathLength: [0, 1],
                opacity: [0.6, 1],
                transition: {
                    duration: 0.35 * duration,
                    ease: "easeOut",
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
                <svg
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
                    <motion.g
                        animate={arcControls}
                        initial="visible"
                        variants={arcVariants}
                        style={{
                            transformBox: "fill-box",
                            transformOrigin: "center",
                        }}
                    >
                        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                        <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                        <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                    </motion.g>

                    <motion.path
                        d="m2 2 20 20"
                        animate={slashControls}
                        initial="visible"
                        variants={slashVariants}
                    />
                </svg>
            </div>
        );
    },
);

EyeOffIcon.displayName = "EyeOffIcon";
export { EyeOffIcon };
