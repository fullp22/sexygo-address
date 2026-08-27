"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { parseKstDateTime } from "@/lib/kst";

async function guard() {
  if (!(await isAdmin())) redirect("/admin/login");
}

function text(form: FormData, name: string) {
  return String(form.get(name) || "").trim();
}

function number(form: FormData, name: string) {
  const value = Number(form.get(name) || 0);
  return Number.isFinite(value) ? Math.trunc(value) : 0;
}

function validHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validMediaUrl(value: string) {
  if (!value) return true;
  if (value.startsWith("/uploads/")) return true;
  return validHttpUrl(value);
}

function parseDateTimeLocal(value: string) {
  return parseKstDateTime(value);
}

function swapIndex(ids: number[], id: number, direction: "up" | "down") {
  const current = ids.indexOf(id);
  if (current < 0) return ids;
  const target = direction === "up" ? current - 1 : current + 1;
  if (target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[current], next[target]] = [next[target], next[current]];
  return next;
}

export async function updateTelegramSupport(form: FormData) {
  await guard();
  const telegramSupportUrl = text(form, "telegramSupportUrl");
  if (telegramSupportUrl && !validHttpUrl(telegramSupportUrl)) return;

  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: { telegramSupportUrl },
    create: { id: 1, telegramSupportUrl },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createCategory(form: FormData) {
  await guard();
  const name = text(form, "name");
  if (!name) return;

  await prisma.category.create({
    data: {
      name,
      icon: text(form, "icon") || "•",
      sortOrder: number(form, "sortOrder"),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateCategory(id: number, form: FormData) {
  await guard();
  const name = text(form, "name");
  if (!name) return;

  await prisma.category.update({
    where: { id },
    data: {
      name,
      icon: text(form, "icon") || "•",
      sortOrder: number(form, "sortOrder"),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteCategory(id: number) {
  await guard();

  const siteCount = await prisma.site.count({ where: { categoryId: id } });
  if (siteCount > 0) {
    redirect(`/admin/category/${id}?error=has-sites`);
  }

  await prisma.category.delete({ where: { id } }).catch(() => null);
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function createSite(form: FormData) {
  await guard();
  const name = text(form, "name");
  const url = text(form, "url");
  const categoryId = number(form, "categoryId");

  if (!name || !validHttpUrl(url) || !categoryId) return;

  await prisma.site.create({
    data: {
      name,
      url,
      color: text(form, "color") || "#222222",
      sortOrder: number(form, "sortOrder"),
      categoryId,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateSite(id: number, form: FormData) {
  await guard();

  const name = text(form, "name");
  const url = text(form, "url");
  const categoryId = number(form, "categoryId");

  if (!name || !validHttpUrl(url) || !categoryId) return;

  await prisma.site.update({
    where: { id },
    data: {
      name,
      url,
      categoryId,
      color: text(form, "color") || "#222222",
      sortOrder: number(form, "sortOrder"),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function createBanner(form: FormData) {
  await guard();

  const title = text(form, "title");
  const linkUrl = text(form, "linkUrl");
  const imageUrl = text(form, "imageUrl");
  const videoUrl = text(form, "videoUrl");
  const requestedSize = text(form, "size");
  const size = ["LARGE", "MEDIUM", "THIRD", "SMALL"].includes(requestedSize)
    ? requestedSize
    : "SMALL";
  const startAt = parseDateTimeLocal(text(form, "startAt"));
  const endAt = parseDateTimeLocal(text(form, "endAt"));

  if (!title || !validHttpUrl(linkUrl)) return;
  if (!validMediaUrl(imageUrl)) return;
  if (!validMediaUrl(videoUrl)) return;
  if (startAt && endAt && endAt < startAt) return;

  await prisma.banner.create({
    data: {
      title,
      subtitle: text(form, "subtitle") || null,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      linkUrl,
      size,
      sortOrder: number(form, "sortOrder"),
      startAt,
      endAt,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateBanner(id: number, form: FormData) {
  await guard();

  const title = text(form, "title");
  const linkUrl = text(form, "linkUrl");
  const imageUrl = text(form, "imageUrl");
  const videoUrl = text(form, "videoUrl");
  const requestedSize = text(form, "size");
  const size = ["LARGE", "MEDIUM", "THIRD", "SMALL"].includes(requestedSize)
    ? requestedSize
    : "SMALL";
  const startAt = parseDateTimeLocal(text(form, "startAt"));
  const endAt = parseDateTimeLocal(text(form, "endAt"));

  if (!title || !validHttpUrl(linkUrl)) return;
  if (!validMediaUrl(imageUrl)) return;
  if (!validMediaUrl(videoUrl)) return;
  if (startAt && endAt && endAt < startAt) return;

  await prisma.banner.update({
    where: { id },
    data: {
      title,
      subtitle: text(form, "subtitle") || null,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      linkUrl,
      size,
      sortOrder: number(form, "sortOrder"),
      startAt,
      endAt,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function moveBanner(id: number, direction: "up" | "down") {
  await guard();

  const items = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  const reordered = swapIndex(items.map((item) => item.id), id, direction);

  await prisma.$transaction(
    reordered.map((bannerId, index) =>
      prisma.banner.update({
        where: { id: bannerId },
        data: { sortOrder: index },
      }),
    ),
  );

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function moveCategory(id: number, direction: "up" | "down") {
  await guard();

  const items = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  const reordered = swapIndex(items.map((item) => item.id), id, direction);

  await prisma.$transaction(
    reordered.map((categoryId, index) =>
      prisma.category.update({
        where: { id: categoryId },
        data: { sortOrder: index },
      }),
    ),
  );

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function moveSite(id: number, direction: "up" | "down") {
  await guard();

  const current = await prisma.site.findUnique({
    where: { id },
    select: { categoryId: true },
  });
  if (!current) return;

  const items = await prisma.site.findMany({
    where: { categoryId: current.categoryId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  const reordered = swapIndex(items.map((item) => item.id), id, direction);

  await prisma.$transaction(
    reordered.map((siteId, index) =>
      prisma.site.update({
        where: { id: siteId },
        data: { sortOrder: index },
      }),
    ),
  );

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function toggleBanner(id: number) {
  await guard();
  const item = await prisma.banner.findUnique({ where: { id } });
  if (!item) return;

  await prisma.banner.update({
    where: { id },
    data: { active: !item.active },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteBanner(id: number) {
  await guard();
  await prisma.banner.delete({ where: { id } }).catch(() => null);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function toggleSite(id: number) {
  await guard();
  const item = await prisma.site.findUnique({ where: { id } });
  if (!item) return;

  await prisma.site.update({
    where: { id },
    data: { active: !item.active },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteSite(id: number) {
  await guard();
  await prisma.site.delete({ where: { id } }).catch(() => null);
  revalidatePath("/");
  revalidatePath("/admin");
}
