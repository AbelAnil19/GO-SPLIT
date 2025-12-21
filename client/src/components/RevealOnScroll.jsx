import { useEffect, useRef, useState } from 'react';

const RevealOnScroll = ({ children, className = "" }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Only animate once
                }
            },
            {
                threshold: 0.1, // Trigger when 10% visible
                rootMargin: "0px 0px -50px 0px" // Trigger slightly before it hits bottom
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, []);

    const baseClasses = "transition-all duration-1000 ease-out transform";
    const hiddenClasses = "opacity-0 translate-y-12";
    const visibleClasses = "opacity-100 translate-y-0";

    return (
        <div ref={ref} className={`${baseClasses} ${isVisible ? visibleClasses : hiddenClasses} ${className}`}>
            {children}
        </div>
    );
};

export default RevealOnScroll;
