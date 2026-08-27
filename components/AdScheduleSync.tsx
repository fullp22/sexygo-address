"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const FALLBACK_MS = 5 * 60 * 1000;
const MIN_DELAY_MS = 300;

export default function AdScheduleSync() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function arm() {
      try {
        const response = await fetch("/api/banner-schedule", {
          cache: "no-store",
          headers: { "cache-control": "no-cache" },
        });
        if (!response.ok) throw new Error("schedule fetch failed");

        const data = (await response.json()) as {
          nextChangeAt?: string | null;
        };
        if (cancelled) return;

        const target = data.nextChangeAt
          ? new Date(data.nextChangeAt).getTime()
          : Number.NaN;

        const delay = Number.isFinite(target)
          ? Math.max(MIN_DELAY_MS, target - Date.now() + 500)
          : FALLBACK_MS;

        timer = setTimeout(() => {
          router.refresh();
          void arm();
        }, delay);
      } catch {
        if (cancelled) return;
        timer = setTimeout(() => {
          router.refresh();
          void arm();
        }, 60_000);
      }
    }

    void arm();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  return null;
}
