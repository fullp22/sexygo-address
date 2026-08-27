import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();

  const [nextStart, nextEnd] = await Promise.all([
    prisma.banner.findFirst({
      where: { active: true, startAt: { gt: now } },
      orderBy: { startAt: "asc" },
      select: { startAt: true },
    }),
    prisma.banner.findFirst({
      where: {
        active: true,
        endAt: { gt: now },
        OR: [{ startAt: null }, { startAt: { lte: now } }],
      },
      orderBy: { endAt: "asc" },
      select: { endAt: true },
    }),
  ]);

  const times = [nextStart?.startAt, nextEnd?.endAt].filter(
    (value): value is Date => Boolean(value),
  );

  const nextChangeAt =
    times.length > 0
      ? new Date(Math.min(...times.map((value) => value.getTime()))).toISOString()
      : null;

  return NextResponse.json(
    { nextChangeAt },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
