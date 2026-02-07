import React, { useState, useLayoutEffect } from "react";

interface RippleProps {
    color?: string;
    duration?: number;
}

const Ripple: React.FC<RippleProps> = ({ color = "rgba(0, 0, 0, 0.1)", duration = 600 }) => {
    const [rippleArray, setRippleArray] = useState<any[]>([]);

    useLayoutEffect(() => {
        let bounce: any;
        if (rippleArray.length > 0) {
            window.clearTimeout(bounce);

            bounce = window.setTimeout(() => {
                setRippleArray([]);
                window.clearTimeout(bounce);
            }, duration * 2);
        }

        return () => window.clearTimeout(bounce);
    }, [rippleArray.length, duration]);

    const addRipple = (event: React.MouseEvent<HTMLDivElement>) => {
        const rippleContainer = event.currentTarget.getBoundingClientRect();
        const size =
            rippleContainer.width > rippleContainer.height
                ? rippleContainer.width
                : rippleContainer.height;
        const x = event.pageX - rippleContainer.x - size / 2;
        const y = event.pageY - rippleContainer.y - size / 2;
        const newRipple = {
            x,
            y,
            size,
        };

        setRippleArray([...rippleArray, newRipple]);
    };

    return (
        <div
            className="absolute inset-0 overflow-hidden rounded-[inherit]"
            onMouseDown={addRipple}
        >
            {rippleArray.length > 0 &&
                rippleArray.map((ripple, index) => {
                    return (
                        <span
                            key={"ripple_" + index}
                            style={{
                                top: ripple.y,
                                left: ripple.x,
                                width: ripple.size,
                                height: ripple.size,
                                backgroundColor: color,
                                animationDuration: `${duration}ms`,
                            }}
                            className="absolute scale-0 rounded-full animate-ripple pointer-events-none"
                        />
                    );
                })}
        </div>
    );
};

export default Ripple;
