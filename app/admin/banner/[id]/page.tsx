import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import MediaUploadField from "@/components/admin/MediaUploadField";
import AdSpecGuide from "@/components/admin/AdSpecGuide";
import { updateBanner } from "../../actions";
import { formatKstDateTimeInput } from "@/lib/kst";

function datetimeLocalValue(date: Date | null) {
  return formatKstDateTimeInput(date);
}

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) notFound();

  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) notFound();

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4">
      <section className="mx-auto max-w-xl border border-[#ddd] bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-[#ff6a00]">BANNER EDIT</p>
            <h1 className="mt-1 text-xl font-black">광고 배너 수정</h1>
          </div>
          <Link href="/admin" className="border border-[#ddd] px-3 py-2 text-[9px] font-black">
            돌아가기
          </Link>
        </div>

        <div className="mt-5">
          <AdSpecGuide />
        </div>

        <form action={updateBanner.bind(null, id)} className="mt-5 space-y-2">
          <input name="title" required defaultValue={banner.title} placeholder="광고명" className="admin-input" />
          <input name="subtitle" defaultValue={banner.subtitle || ""} placeholder="짧은 설명" className="admin-input" />
          <MediaUploadField kind="image" name="imageUrl" initialUrl={banner.imageUrl || ""} />
          <MediaUploadField kind="video" name="videoUrl" initialUrl={banner.videoUrl || ""} />
          <input name="linkUrl" required defaultValue={banner.linkUrl} placeholder="클릭 이동 URL" className="admin-input" />
          <select name="size" defaultValue={banner.size} className="admin-input">
            <option value="LARGE">전체 1/1 - 100% - 권장 1200×400</option>
            <option value="MEDIUM">1/2 - 50% - 권장 600×200</option>
            <option value="THIRD">1/3 - 33.33% - 권장 400×134</option>
            <option value="SMALL">1/4 - 25% - 권장 300×100</option>
          </select>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[9px] font-black text-[#666]">광고 시작일</label>
              <input
                name="startAt"
                type="datetime-local"
                defaultValue={datetimeLocalValue(banner.startAt)}
                className="admin-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-black text-[#666]">광고 종료일</label>
              <input
                name="endAt"
                type="datetime-local"
                defaultValue={datetimeLocalValue(banner.endAt)}
                className="admin-input"
              />
            </div>
          </div>
          <input name="sortOrder" type="number" defaultValue={banner.sortOrder} className="admin-input" />
          <button className="mt-3 h-11 w-full bg-[#ff6a00] text-[10px] font-black text-white">
            수정 저장
          </button>
        </form>
      </section>
    </main>
  );
}
