import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { updateSite } from "../../actions";

export default async function EditSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) notFound();

  const [site, categories] = await Promise.all([
    prisma.site.findUnique({ where: { id } }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
  ]);

  if (!site) notFound();

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4">
      <section className="mx-auto max-w-xl border border-[#ddd] bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-[#ff6a00]">SITE EDIT</p>
            <h1 className="mt-1 text-xl font-black">사이트 수정</h1>
          </div>
          <Link href="/admin" className="border border-[#ddd] px-3 py-2 text-[9px] font-black">
            돌아가기
          </Link>
        </div>

        <form action={updateSite.bind(null, id)} className="mt-5 space-y-2">
          <input name="name" required defaultValue={site.name} placeholder="사이트명" className="admin-input" />
          <input name="url" required defaultValue={site.url} placeholder="사이트 URL" className="admin-input" />
          <select name="categoryId" defaultValue={String(site.categoryId)} required className="admin-input">
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input name="color" defaultValue={site.color} placeholder="표시 색상" className="admin-input" />
          <input name="sortOrder" type="number" defaultValue={site.sortOrder} className="admin-input" />
          <button className="mt-3 h-11 w-full bg-[#161616] text-[10px] font-black text-white">
            수정 저장
          </button>
        </form>
      </section>
    </main>
  );
}
