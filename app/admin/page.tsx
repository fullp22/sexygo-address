import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import MediaUploadField from "@/components/admin/MediaUploadField";
import AdSpecGuide from "@/components/admin/AdSpecGuide";
import {
  createBanner,
  createCategory,
  createSite,
  deleteBanner,
  deleteSite,
  moveBanner,
  moveCategory,
  moveSite,
  toggleBanner,
  toggleSite,
  updateTelegramSupport,
} from "./actions";
import { BRAND } from "@/lib/brand";
import { formatKstDateTime } from "@/lib/kst";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 18;

type AdminSearchParams = {
  bq?: string;
  bstatus?: string;
  bsize?: string;
  bpage?: string;
  sq?: string;
  scategory?: string;
  sstatus?: string;
  spage?: string;
};

function pageNumber(value?: string) {
  const parsed = Number(value || "1");
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.trunc(parsed);
}

function sizeLabel(size: string) {
  if (size === "LARGE") return "전체 · 100%";
  if (size === "MEDIUM") return "1/2 · 50%";
  if (size === "THIRD") return "1/3 · 33.33%";
  return "1/4 · 25%";
}

function scheduleLabel(startAt: Date | null, endAt: Date | null) {
  const start = startAt ? formatKstDateTime(startAt) : "즉시";
  const end = endAt ? formatKstDateTime(endAt) : "무기한";
  return `${start} ~ ${end}`;
}

function pageHref(
  current: AdminSearchParams,
  key: "bpage" | "spage",
  value: number,
) {
  const query = new URLSearchParams();

  for (const [name, raw] of Object.entries(current)) {
    if (!raw) continue;
    if (name === key) continue;
    query.set(name, raw);
  }

  query.set(key, String(value));
  return `/admin?${query.toString()}#${key === "bpage" ? "banners" : "sites"}`;
}

function Pager({
  current,
  totalPages,
  params,
  pageKey,
}: {
  current: number;
  totalPages: number;
  params: AdminSearchParams;
  pageKey: "bpage" | "spage";
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 border-t border-[#eee] px-4 py-3">
      <Link
        href={pageHref(params, pageKey, Math.max(1, current - 1))}
        className={`border border-[#ddd] px-2.5 py-1.5 text-[9px] font-black ${
          current <= 1 ? "pointer-events-none opacity-30" : ""
        }`}
      >
        이전
      </Link>
      <span className="px-2 text-[9px] font-bold text-[#888]">
        {current} / {totalPages}
      </span>
      <Link
        href={pageHref(params, pageKey, Math.min(totalPages, current + 1))}
        className={`border border-[#ddd] px-2.5 py-1.5 text-[9px] font-black ${
          current >= totalPages ? "pointer-events-none opacity-30" : ""
        }`}
      >
        다음
      </Link>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const params = await searchParams;

  const bq = (params.bq || "").trim();
  const bstatus = params.bstatus || "all";
  const bsize = params.bsize || "all";
  const bpage = pageNumber(params.bpage);

  const sq = (params.sq || "").trim();
  const scategory = params.scategory || "all";
  const sstatus = params.sstatus || "all";
  const spage = pageNumber(params.spage);

  const bannerWhere = {
    ...(bq
      ? {
          OR: [
            { title: { contains: bq } },
            { subtitle: { contains: bq } },
            { linkUrl: { contains: bq } },
          ],
        }
      : {}),
    ...(bstatus === "active"
      ? { active: true }
      : bstatus === "hidden"
        ? { active: false }
        : {}),
    ...(bsize !== "all" ? { size: bsize } : {}),
  };

  const siteWhere = {
    ...(sq
      ? {
          OR: [
            { name: { contains: sq } },
            { url: { contains: sq } },
          ],
        }
      : {}),
    ...(sstatus === "active"
      ? { active: true }
      : sstatus === "hidden"
        ? { active: false }
        : {}),
    ...(scategory !== "all" && Number.isInteger(Number(scategory))
      ? { categoryId: Number(scategory) }
      : {}),
  };

  const [
    categories,
    settings,
    categoryCount,
    siteCount,
    bannerCount,
    siteClickAggregate,
    bannerClickAggregate,
    filteredBannerCount,
    filteredSiteCount,
  ] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.siteSetting.findUnique({ where: { id: 1 } }),
    prisma.category.count(),
    prisma.site.count(),
    prisma.banner.count(),
    prisma.site.aggregate({ _sum: { clicks: true } }),
    prisma.banner.aggregate({ _sum: { clicks: true, impressions: true } }),
    prisma.banner.count({ where: bannerWhere }),
    prisma.site.count({ where: siteWhere }),
  ]);

  const bannerPages = Math.max(1, Math.ceil(filteredBannerCount / PAGE_SIZE));
  const sitePages = Math.max(1, Math.ceil(filteredSiteCount / PAGE_SIZE));
  const safeBannerPage = Math.min(bpage, bannerPages);
  const safeSitePage = Math.min(spage, sitePages);

  const [banners, sites] = await Promise.all([
    prisma.banner.findMany({
      where: bannerWhere,
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      skip: (safeBannerPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.site.findMany({
      where: siteWhere,
      include: { category: true },
      orderBy: [
        { category: { sortOrder: "asc" } },
        { sortOrder: "asc" },
        { id: "asc" },
      ],
      skip: (safeSitePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalClicks =
    (siteClickAggregate._sum.clicks || 0) +
    (bannerClickAggregate._sum.clicks || 0);

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-[#161616]">
      <header className="border-b border-[#ddd] bg-white">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3">
          <div>
            <p className="text-[10px] font-black text-[#ff6a00]">{BRAND.english}</p>
            <h1 className="text-lg font-black">{BRAND.name} 관리자</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="border border-[#ddd] px-3 py-2 text-[10px] font-black">
              메인 보기
            </Link>
            <form action="/api/admin/logout" method="POST">
              <button className="border border-[#ddd] px-3 py-2 text-[10px] font-black">
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] space-y-4 px-4 py-4">
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["카테고리", categoryCount],
            ["사이트", siteCount],
            ["배너 노출", bannerClickAggregate._sum.impressions || 0],
            ["누적 클릭", totalClicks],
          ].map(([label, value]) => (
            <div key={String(label)} className="border border-[#ddd] bg-white p-4">
              <p className="text-[9px] font-black text-[#999]">{label}</p>
              <p className="mt-2 text-2xl font-black">{value}</p>
            </div>
          ))}
        </section>

        <section className="border border-[#ddd] bg-white p-4">
          <h2 className="text-sm font-black">고객센터 설정</h2>
          <p className="mt-1 text-[9px] text-[#999]">
            메인 상단 Telegram 고객센터 버튼으로 연결됩니다.
          </p>
          <form action={updateTelegramSupport} className="mt-3 flex gap-2">
            <input
              name="telegramSupportUrl"
              defaultValue={settings?.telegramSupportUrl || ""}
              placeholder="https://t.me/계정명"
              className="admin-input flex-1"
            />
            <button className="shrink-0 bg-[#229ed9] px-4 text-[10px] font-black text-white">
              저장
            </button>
          </form>
        </section>

        <AdSpecGuide />

        <section className="grid gap-4 lg:grid-cols-3">
          <form action={createBanner} className="border border-[#ddd] bg-white p-4">
            <h2 className="text-sm font-black">+ 광고 배너 추가</h2>
            <p className="mt-1 text-[9px] leading-4 text-[#999]">
              PC/모바일 동일 비율 · 이미지 최대 5MB · 영상 최대 20MB.
            </p>
            <div className="mt-3 space-y-2">
              <input name="title" required placeholder="광고명" className="admin-input" />
              <input name="subtitle" placeholder="짧은 설명" className="admin-input" />
              <MediaUploadField kind="image" name="imageUrl" />
              <MediaUploadField kind="video" name="videoUrl" />
              <input name="linkUrl" required placeholder="클릭 이동 URL (https://...)" className="admin-input" />
              <select name="size" defaultValue="SMALL" className="admin-input">
                <option value="LARGE">전체 1/1 - 100% - 권장 1200×400</option>
                <option value="MEDIUM">1/2 - 50% - 권장 600×200</option>
                <option value="THIRD">1/3 - 33.33% - 권장 400×134</option>
                <option value="SMALL">1/4 - 25% - 권장 300×100</option>
              </select>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[9px] font-black text-[#666]">광고 시작일</label>
                  <input name="startAt" type="datetime-local" className="admin-input" />
                </div>
                <div>
                  <label className="mb-1 block text-[9px] font-black text-[#666]">광고 종료일</label>
                  <input name="endAt" type="datetime-local" className="admin-input" />
                </div>
              </div>
              <input name="sortOrder" type="number" defaultValue="0" placeholder="초기 노출 순서" className="admin-input" />
            </div>
            <button className="mt-3 w-full bg-[#ff6a00] px-3 py-3 text-[10px] font-black text-white">
              배너 등록
            </button>
          </form>

          <form action={createSite} className="border border-[#ddd] bg-white p-4">
            <h2 className="text-sm font-black">+ 사이트 추가</h2>
            <div className="mt-3 space-y-2">
              <input name="name" required placeholder="사이트명" className="admin-input" />
              <input name="url" required placeholder="사이트 URL" className="admin-input" />
              <select name="categoryId" required className="admin-input">
                <option value="">카테고리 선택</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input name="color" defaultValue="#222222" placeholder="표시 색상" className="admin-input" />
              <input name="sortOrder" type="number" defaultValue="0" placeholder="초기 노출 순서" className="admin-input" />
            </div>
            <button className="mt-3 w-full bg-[#161616] px-3 py-3 text-[10px] font-black text-white">
              사이트 등록
            </button>
          </form>

          <form action={createCategory} className="border border-[#ddd] bg-white p-4">
            <h2 className="text-sm font-black">+ 카테고리 추가</h2>
            <div className="mt-3 space-y-2">
              <input name="name" required placeholder="카테고리명" className="admin-input" />
              <input name="icon" placeholder="아이콘 문자 (예: ★)" className="admin-input" />
              <input name="sortOrder" type="number" defaultValue="0" placeholder="초기 노출 순서" className="admin-input" />
            </div>
            <button className="mt-3 w-full bg-[#4b5563] px-3 py-3 text-[10px] font-black text-white">
              카테고리 등록
            </button>
          </form>
        </section>

        <section id="banners" className="border border-[#ddd] bg-white">
          <div className="border-b border-[#eee] p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-black">광고 배너 관리</h2>
                <p className="mt-1 text-[8px] text-[#aaa]">
                  총 {filteredBannerCount}개 검색됨 · 한 페이지 {PAGE_SIZE}개
                </p>
              </div>

              <form method="GET" action="/admin" className="grid w-full gap-1.5 sm:w-auto sm:grid-cols-[220px_110px_130px_auto]">
                <input type="hidden" name="sq" value={sq} />
                <input type="hidden" name="scategory" value={scategory} />
                <input type="hidden" name="sstatus" value={sstatus} />
                <input
                  name="bq"
                  defaultValue={bq}
                  placeholder="광고명 / 링크 검색"
                  className="admin-filter"
                />
                <select name="bstatus" defaultValue={bstatus} className="admin-filter">
                  <option value="all">전체 상태</option>
                  <option value="active">노출중</option>
                  <option value="hidden">숨김</option>
                </select>
                <select name="bsize" defaultValue={bsize} className="admin-filter">
                  <option value="all">전체 크기</option>
                  <option value="LARGE">전체 1/1</option>
                  <option value="MEDIUM">1/2</option>
                  <option value="THIRD">1/3</option>
                  <option value="SMALL">1/4</option>
                </select>
                <button className="bg-[#161616] px-3 py-2 text-[9px] font-black text-white">
                  검색
                </button>
              </form>
            </div>
          </div>

          {banners.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[10px] font-bold text-[#aaa]">조건에 맞는 광고 배너가 없습니다.</p>
              <Link href="/admin#banners" className="mt-3 inline-block border border-[#ddd] px-3 py-2 text-[9px] font-black">
                필터 초기화
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#eee]">
              {banners.map((banner) => (
                <div key={banner.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <span className="w-7 text-center text-[10px] font-black text-[#aaa]">
                    {banner.sortOrder + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-[11px]">{banner.title}</strong>
                      <span className="bg-[#f3f3f3] px-1.5 py-0.5 text-[8px] font-black text-[#777]">
                        {sizeLabel(banner.size)}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-black ${banner.active ? "bg-[#eaf8ef] text-[#29924d]" : "bg-[#f0f0f0] text-[#888]"}`}>
                        {banner.active ? "노출중" : "숨김"}
                      </span>
                      <span className="text-[9px] font-bold text-[#999]">
                        노출 {banner.impressions} · 클릭 {banner.clicks} · CTR{" "}
                        {banner.impressions > 0
                          ? ((banner.clicks / banner.impressions) * 100).toFixed(2)
                          : "0.00"}%
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[9px] text-[#999]">{banner.linkUrl}</p>
                    <p className="mt-1 text-[8px] text-[#aaa]">
                      기간: {scheduleLabel(banner.startAt, banner.endAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <form action={moveBanner.bind(null, banner.id, "up")}>
                      <button className="border border-[#ddd] px-2.5 py-2 text-[9px] font-black">↑</button>
                    </form>
                    <form action={moveBanner.bind(null, banner.id, "down")}>
                      <button className="border border-[#ddd] px-2.5 py-2 text-[9px] font-black">↓</button>
                    </form>
                    <Link href={`/admin/banner/${banner.id}`} className="border border-[#ddd] px-2.5 py-2 text-[9px] font-black">
                      수정
                    </Link>
                    <form action={toggleBanner.bind(null, banner.id)}>
                      <button className="border border-[#ddd] px-2.5 py-2 text-[9px] font-black">
                        {banner.active ? "숨기기" : "노출"}
                      </button>
                    </form>
                    <form action={deleteBanner.bind(null, banner.id)}>
                      <button className="border border-[#ffd7d1] bg-[#fff5f3] px-2.5 py-2 text-[9px] font-black text-[#c94d39]">
                        삭제
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pager
            current={safeBannerPage}
            totalPages={bannerPages}
            params={params}
            pageKey="bpage"
          />
        </section>

        <section className="border border-[#ddd] bg-white">
          <div className="border-b border-[#eee] px-4 py-3">
            <h2 className="text-sm font-black">카테고리 위치 관리</h2>
            <p className="mt-1 text-[8px] text-[#aaa]">카테고리 박스의 메인 배치 순서를 변경합니다.</p>
          </div>
          <div className="grid gap-px bg-[#eee] sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <div key={category.id} className="flex items-center gap-3 bg-white p-3">
                <span className="flex h-7 w-7 items-center justify-center bg-[#ff6a00] text-[9px] font-black text-white">
                  {category.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="text-[11px]">{category.name}</strong>
                  <p className="text-[8px] text-[#aaa]">위치 {index + 1}</p>
                </div>
                <div className="flex gap-1">
                  <Link href={`/admin/category/${category.id}`} className="border border-[#ddd] px-2 py-1.5 text-[9px] font-black">
                    수정
                  </Link>
                  <form action={moveCategory.bind(null, category.id, "up")}>
                    <button disabled={index === 0} className="border border-[#ddd] px-2 py-1.5 text-[9px] font-black disabled:opacity-25">↑</button>
                  </form>
                  <form action={moveCategory.bind(null, category.id, "down")}>
                    <button disabled={index === categories.length - 1} className="border border-[#ddd] px-2 py-1.5 text-[9px] font-black disabled:opacity-25">↓</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="sites" className="border border-[#ddd] bg-white">
          <div className="border-b border-[#eee] p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-black">사이트 관리</h2>
                <p className="mt-1 text-[8px] text-[#aaa]">
                  총 {filteredSiteCount}개 검색됨 · 한 페이지 {PAGE_SIZE}개
                </p>
              </div>

              <form method="GET" action="/admin" className="grid w-full gap-1.5 sm:w-auto sm:grid-cols-[220px_130px_110px_auto]">
                <input type="hidden" name="bq" value={bq} />
                <input type="hidden" name="bstatus" value={bstatus} />
                <input type="hidden" name="bsize" value={bsize} />
                <input
                  name="sq"
                  defaultValue={sq}
                  placeholder="사이트명 / URL 검색"
                  className="admin-filter"
                />
                <select name="scategory" defaultValue={scategory} className="admin-filter">
                  <option value="all">전체 카테고리</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <select name="sstatus" defaultValue={sstatus} className="admin-filter">
                  <option value="all">전체 상태</option>
                  <option value="active">노출중</option>
                  <option value="hidden">숨김</option>
                </select>
                <button className="bg-[#161616] px-3 py-2 text-[9px] font-black text-white">
                  검색
                </button>
              </form>
            </div>
          </div>

          {sites.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[10px] font-bold text-[#aaa]">조건에 맞는 사이트가 없습니다.</p>
              <Link href="/admin#sites" className="mt-3 inline-block border border-[#ddd] px-3 py-2 text-[9px] font-black">
                필터 초기화
              </Link>
            </div>
          ) : (
            <div className="grid gap-px bg-[#eee] sm:grid-cols-2 lg:grid-cols-3">
              {sites.map((site) => (
                <div key={site.id} className="bg-white p-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: site.color }} />
                    <strong className="truncate text-[11px]">{site.name}</strong>
                    <span className="ml-auto text-[8px] font-bold text-[#999]">{site.category.name}</span>
                  </div>
                  <p className="mt-2 truncate text-[8px] text-[#aaa]">{site.url}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex gap-2 text-[8px] font-bold text-[#999]">
                      <span>클릭 {site.clicks}</span>
                      <span>{site.active ? "노출중" : "숨김"}</span>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1">
                      <form action={moveSite.bind(null, site.id, "up")}>
                        <button className="border border-[#ddd] px-2 py-1.5 text-[8px] font-black">↑</button>
                      </form>
                      <form action={moveSite.bind(null, site.id, "down")}>
                        <button className="border border-[#ddd] px-2 py-1.5 text-[8px] font-black">↓</button>
                      </form>
                      <Link href={`/admin/site/${site.id}`} className="border border-[#ddd] px-2 py-1.5 text-[8px] font-black">
                        수정
                      </Link>
                      <form action={toggleSite.bind(null, site.id)}>
                        <button className="border border-[#ddd] px-2 py-1.5 text-[8px] font-black">
                          {site.active ? "숨김" : "노출"}
                        </button>
                      </form>
                      <form action={deleteSite.bind(null, site.id)}>
                        <button className="border border-[#ffd7d1] px-2 py-1.5 text-[8px] font-black text-[#c94d39]">
                          삭제
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pager
            current={safeSitePage}
            totalPages={sitePages}
            params={params}
            pageKey="spage"
          />
        </section>
      </div>
    </main>
  );
}
