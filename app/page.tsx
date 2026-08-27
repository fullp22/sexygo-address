import DirectoryClient from "@/components/DirectoryClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const now = new Date();

  const [categories, banners, settings] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        icon: true,
        sites: {
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    }),
    prisma.banner.findMany({
      where: {
        active: true,
        AND: [
          {
            OR: [{ startAt: null }, { startAt: { lte: now } }],
          },
          {
            OR: [{ endAt: null }, { endAt: { gte: now } }],
          },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: {
        id: true,
        title: true,
        subtitle: true,
        imageUrl: true,
        videoUrl: true,
        size: true,
      },
    }),
    prisma.siteSetting.findUnique({
      where: { id: 1 },
      select: { telegramSupportUrl: true },
    }),
  ]);

  return (
    <DirectoryClient
      categories={categories}
      banners={banners}
      telegramSupportUrl={settings?.telegramSupportUrl || ""}
    />
  );
}
