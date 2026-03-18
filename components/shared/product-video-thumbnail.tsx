"use client";

import { useRef } from "react";

export function ProductVideoThumbnail({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleMouseEnter() {
    videoRef.current?.play();
  }

  function handleMouseLeave() {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }

  return (
    <div
      className={`relative h-full w-full ${className ?? ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
      {/* Play hint — fades out on hover */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="translate-x-0.5 text-white"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
