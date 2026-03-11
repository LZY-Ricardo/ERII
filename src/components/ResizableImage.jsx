"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

export default function ResizableImage({ src, alt, width: initialWidth, onResize }) {
    const parsedInitialWidth = Number.parseInt(initialWidth, 10);
    const [width, setWidth] = useState(Number.isFinite(parsedInitialWidth) ? parsedInitialWidth : 640);
    const [isResizing, setIsResizing] = useState(false);
    const [showHandle, setShowHandle] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(0.625);
    const containerRef = useRef(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = containerRef.current?.offsetWidth || width || 400;

        const handleMouseMove = (moveEvent) => {
            const delta = moveEvent.clientX - startXRef.current;
            const newWidth = Math.max(100, startWidthRef.current + delta);
            setWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);

            if (onResize && containerRef.current) {
                onResize(src, containerRef.current.offsetWidth);
            }
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }, [src, onResize, width]);

    return (
        <span
            ref={containerRef}
            className="relative inline-block my-4"
            onMouseEnter={() => setShowHandle(true)}
            onMouseLeave={() => !isResizing && setShowHandle(false)}
            style={{
                width: `${width}px`,
                maxWidth: "100%",
            }}
        >
            <Image
                src={src}
                alt={alt || ""}
                width={Math.max(100, Math.round(width))}
                height={Math.max(80, Math.round(width * aspectRatio))}
                unoptimized
                loader={({ src: currentSrc }) => String(currentSrc ?? "")}
                className="rounded-xl block"
                style={{ width: "100%", height: "auto" }}
                draggable={false}
                onLoadingComplete={(img) => {
                    const naturalWidth = Number(img?.naturalWidth ?? 0);
                    const naturalHeight = Number(img?.naturalHeight ?? 0);
                    if (naturalWidth > 0 && naturalHeight > 0) {
                        setAspectRatio(naturalHeight / naturalWidth);
                    }
                }}
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
