import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function safeRedirectUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ type: string; id: string }> },
) {
  const { type, id } = await context.params;
  const numericId = Number(id);
  const fallback = new URL("/", request.url);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.redirect(fallback);
  }

  if (type === "site") {
    const site = await prisma.site.findFirst({
      where: { id: numericId, active: true },
      select: { id: true, url: true },
    });
    if (!site) return NextResponse.redirect(fallback);

    const target = safeRedirectUrl(site.url);
    if (!target) return NextResponse.redirect(fallback);

    await prisma.site.update({
      where: { id: site.id },
      data: { clicks: { increment: 1 } },
    });

    return NextResponse.redirect(target);
  }

  if (type === "banner") {
    const now = new Date();
    const banner = await prisma.banner.findFirst({
      where: {
        id: numericId,
        active: true,
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      select: { id: true, linkUrl: true },
    });

    if (!banner) return NextResponse.redirect(fallback);

    const target = safeRedirectUrl(banner.linkUrl);
    if (!target) return NextResponse.redirect(fallback);

    await prisma.banner.update({
      where: { id: banner.id },
      data: { clicks: { increment: 1 } },
    });

    return NextResponse.redirect(target);
  }

  return NextResponse.redirect(fallback);
}
