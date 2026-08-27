"use client";

import { useEffect, useRef } from "react";
import SmartBannerMedia from "@/components/SmartBannerMedia";

export default function TrackedBanner({
  banner,
  className,
}: {
  banner: {
    id: number;
    title: string;
    subtitle: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
  };
  className: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const sent = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (sent.current) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          timer = setTimeout(() => {
            if (sent.current) return;
            sent.current = true;

            fetch(`/api/impression/banner/${banner.id}`, {
              method: "POST",
              keepalive: true,
            }).catch(() => undefined);
          }, 900);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: [0, 0.5, 1] },
    );

    observer.observe(element);

    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [banner.id]);

  const hasMedia = Boolean(banner.videoUrl || banner.imageUrl);

  return (
    <a
      ref={ref}
      href={`/go/banner/${banner.id}`}
      target="_blank"
      rel="noreferrer"
      className={`group relative overflow-hidden border border-[#dedede] bg-white ${className}`}
    >
      {hasMedia ? (
        <>
          <SmartBannerMedia
            videoUrl={banner.videoUrl}
            imageUrl={banner.imageUrl}
            title={banner.title}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-black/5 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2.5 text-white">
            <span className="rounded bg-white/90 px-1.5 py-0.5 text-[7px] font-black text-[#666]">
              AD
            </span>
            <p className="mt-1 truncate text-[10px] font-black">{banner.title}</p>
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-between bg-[#fffaf4] px-3 py-2">
          <div className="min-w-0">
            <span className="text-[8px] font-black text-[#ff6a00]">AD</span>
            <p className="mt-1 truncate text-[11px] font-black">{banner.title}</p>
            {banner.subtitle && (
              <p className="mt-0.5 truncate text-[8px] text-[#999]">
                {banner.subtitle}
              </p>
            )}
          </div>
          <span className="ml-2 shrink-0 text-[#bbb]">›</span>
        </div>
      )}
    </a>
  );
}
