"use client";

import { useCallback, useRef, useState } from "react";

export default function ResizableImage({ src, alt, width: initialWidth, onResize }) {
    const [width, setWidth] = useState(initialWidth ? parseInt(initialWidth, 10) : null);
    const [isResizing, setIsResizing] = useState(false);
    const [showHandle, setShowHandle] = useState(false);
    const imgRef = useRef(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = imgRef.current?.offsetWidth || 400;

        const handleMouseMove = (moveEvent) => {
            const delta = moveEvent.clientX - startXRef.current;
            const newWidth = Math.max(100, startWidthRef.current + delta);
            setWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);

            if (onResize && imgRef.current) {
                onResize(src, imgRef.current.offsetWidth);
            }
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }, [src, onResize]);

    return (
        <span
            className="relative inline-block my-4"
            onMouseEnter={() => setShowHandle(true)}
            onMouseLeave={() => !isResizing && setShowHandle(false)}
        >
            <img
                ref={imgRef}
                src={src}
                alt={alt || ""}
                style={{ width: width ? `${width}px` : "auto", maxWidth: "100%" }}
                className="rounded-xl block"
                draggable={false}
            />
            {showHandle && (
                <span
                    onMouseDown={handleMouseDown}
                    className="absolute bottom-1 right-1 w-4 h-4 bg-erii-red/80 rounded-full cursor-se-resize shadow-md hover:bg-erii-red transition-colors flex items-center justify-center"
                    title="拖拽调整大小"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-white">
                        <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </span>
            )}
        </span>
    );
}
