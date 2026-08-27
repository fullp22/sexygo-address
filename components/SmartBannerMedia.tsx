"use client";

import { useEffect, useRef, useState } from "react";

export default function SmartBannerMedia({
  videoUrl,
  imageUrl,
  title,
}: {
  videoUrl: string | null;
  imageUrl: string | null;
  title: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "160px 0px", threshold: 0.05 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (visible) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [visible]);

  return (
    <div ref={wrapperRef} className="absolute inset-0 bg-[#efefef]">
      {videoUrl ? (
        <video
          ref={videoRef}
          src={visible ? videoUrl : undefined}
          poster={imageUrl || undefined}
          muted
          loop
          playsInline
          preload="none"
          aria-label={title}
          className="h-full w-full object-cover"
        />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : null}
    </div>
  );
}
