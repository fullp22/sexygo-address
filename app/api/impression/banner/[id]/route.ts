import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const bannerId = Number(id);

  if (!Number.isInteger(bannerId) || bannerId <= 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const now = new Date();
  const result = await prisma.banner.updateMany({
    where: {
      id: bannerId,
      active: true,
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
    data: { impressions: { increment: 1 } },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { ok: false, reason: "inactive-or-outside-schedule" },
      {
        status: 410,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
