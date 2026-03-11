import React, { forwardRef, useImperativeHandle, useState } from 'react';

const AnalyticsIcon = forwardRef((props, ref) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useImperativeHandle(ref, () => ({
        startAnimation: () => setIsAnimating(true),
        stopAnimation: () => setIsAnimating(false)
    }));

    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="icon-analytics"
        >
            {/* Bar 1 - Short */}
            <rect
                x="4"
                y="16"
                width="3"
                height="5"
                rx="1"
                fill="currentColor"
                style={{
                    transformOrigin: '5.5px 20px',
                    animation: isAnimating ? 'barBounce1 1s ease-in-out infinite' : 'none'
                }}
            />

            {/* Bar 2 - Medium */}
            <rect
                x="10"
                y="12"
                width="3"
                height="9"
                rx="1"
                fill="currentColor"
                style={{
                    transformOrigin: '11.5px 20px',
                    animation: isAnimating ? 'barBounce2 1s ease-in-out infinite 0.15s' : 'none'
                }}
            />

            {/* Bar 3 - Tall */}
            <rect
                x="16"
                y="8"
                width="3"
                height="13"
                rx="1"
                fill="currentColor"
                style={{
                    transformOrigin: '17.5px 20px',
                    animation: isAnimating ? 'barBounce3 1s ease-in-out infinite 0.3s' : 'none'
                }}
            />

            {/* Inline styles for animations */}
            <style>
                {`
                @keyframes barBounce1 {
                    0%, 100% {
                        transform: scaleY(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scaleY(1.3);
                        opacity: 0.8;
                    }
                }

                @keyframes barBounce2 {
                    0%, 100% {
                        transform: scaleY(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scaleY(1.2);
                        opacity: 0.8;
                    }
                }

                @keyframes barBounce3 {
                    0%, 100% {
                        transform: scaleY(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scaleY(1.15);
                        opacity: 0.8;
                    }
                }
                `}
            </style>
        </svg>
    );
});

AnalyticsIcon.displayName = 'AnalyticsIcon';

export default AnalyticsIcon;
