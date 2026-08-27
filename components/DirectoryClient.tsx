"use client";

import { useMemo, useState } from "react";
import { BRAND } from "@/lib/brand";
import TrackedBanner from "@/components/TrackedBanner";
import AdScheduleSync from "@/components/AdScheduleSync";

export type PublicCategory = {
  id: number;
  name: string;
  icon: string;
  sites: {
    id: number;
    name: string;
    color: string;
  }[];
};

export type PublicBanner = {
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  size: string;
};

function bannerClass(size: string) {
  if (size === "LARGE") return "col-span-12 aspect-[3/1]";
  if (size === "MEDIUM") return "col-span-6 aspect-[3/1]";
  if (size === "THIRD") return "col-span-4 aspect-[3/1]";
  return "col-span-3 aspect-[3/1]";
}

export default function DirectoryClient({
  categories,
  banners,
  telegramSupportUrl,
}: {
  categories: PublicCategory[];
  banners: PublicBanner[];
  telegramSupportUrl: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return categories;

    return categories
      .map((category) => ({
        ...category,
        sites: category.sites.filter((site) =>
          `${site.name} ${category.name}`.toLowerCase().includes(keyword),
        ),
      }))
      .filter((category) => category.sites.length > 0);
  }, [categories, query]);

  const count = filtered.reduce((sum, category) => sum + category.sites.length, 0);

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-[#161616]">
      <AdScheduleSync />
      <header className="border-b border-[#dedede] bg-white">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-end gap-2">
            <strong className="shrink-0 text-[22px] font-black tracking-[-0.06em] text-[#ff6a00]">
              {BRAND.name}
            </strong>
            <span className="hidden truncate pb-[2px] text-[9px] font-bold text-[#aaa] min-[390px]:block">
              {BRAND.tagline}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-[10px] font-bold">
            <button type="button" className="text-[#888]">즐겨찾기</button>
            <a
              href={telegramSupportUrl || "https://t.me/"}
              target="_blank"
              rel="noreferrer"
              className="border border-[#dedede] bg-[#fafafa] px-2.5 py-1.5 text-[#555]"
            >
              고객센터 · Telegram
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-3 py-3 sm:px-4">
        {banners.length > 0 && (
          <section className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[8px] font-black tracking-[0.12em] text-[#aaa]">
                ADVERTISEMENT
              </span>
              <span className="text-[8px] font-bold text-[#bbb]">광고</span>
            </div>

            <div className="grid grid-cols-12 gap-1.5">
              {banners.map((banner) => (
                <TrackedBanner
                  key={banner.id}
                  banner={banner}
                  className={bannerClass(banner.size)}
                />
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-[#e2e2e2] pt-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_310px]">
            <div className="flex h-[42px] items-center border border-[#d9d9d9] bg-white">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="사이트 이름을 검색하세요"
                className="min-w-0 flex-1 px-3 text-[12px] font-bold outline-none placeholder:font-normal placeholder:text-[#aaa]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="px-3 text-[10px] font-bold text-[#999]"
                >
                  지우기
                </button>
              )}
              <div className="flex h-full w-[54px] items-center justify-center bg-[#ff6a00] text-[15px] font-black text-white">
                ⌕
              </div>
            </div>

            <div className="hidden items-center justify-center border border-[#ddd] bg-white text-[10px] font-bold text-[#aaa] sm:flex">
              빠른 사이트 탐색 · {categories.length}개 카테고리
            </div>
          </div>

          {query && (
            <div className="mt-2 border border-[#ddd] bg-white px-3 py-2 text-[10px] text-[#777]">
              <strong className="text-[#ff6a00]">{query}</strong> 검색 결과 {count}개
            </div>
          )}
        </section>

        <section className="mt-2 grid items-start gap-px border border-[#ddd] bg-[#ddd] sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((category) => (
            <div key={category.id} className="min-h-[208px] bg-white">
              <div className="flex h-[34px] items-center justify-between border-b border-[#e5e5e5] bg-[#fafafa] px-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[4px] bg-[#ff6a00] text-[8px] font-black text-white">
                    {category.icon}
                  </span>
                  <h2 className="text-[11px] font-black">
                    {category.name} <span className="font-bold text-[#999]">Top10</span>
                  </h2>
                </div>
                <span className="text-[11px] text-[#bbb]">›</span>
              </div>

              <div className="grid grid-cols-2 gap-x-1 px-2.5 py-2">
                {category.sites.slice(0, 10).map((site, index) => (
                  <a
                    key={site.id}
                    href={`/go/site/${site.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-0 items-center gap-1.5 py-[5px] text-[10px] font-bold hover:underline"
                  >
                    <span className="w-[11px] shrink-0 text-[8px] font-black text-[#bbb]">
                      {index + 1}
                    </span>
                    <span
                      className="h-[6px] w-[6px] shrink-0 rounded-[2px]"
                      style={{ backgroundColor: site.color }}
                    />
                    <span className="truncate" style={{ color: site.color }}>
                      {site.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>

        <footer className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-[#ddd] py-4 text-[9px] font-bold text-[#999]">
          <span>사이트 등록</span>
          <span>광고 문의</span>
          <span>이용 안내</span>
          <span>개인정보처리방침</span>
        </footer>
      </div>
    </main>
  );
}
