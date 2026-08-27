import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { deleteCategory, updateCategory } from "../../actions";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { id: rawId } = await params;
  const query = await searchParams;
  const id = Number(rawId);
  if (!Number.isInteger(id)) notFound();

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { sites: true } } },
  });

  if (!category) notFound();

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4">
      <section className="mx-auto max-w-xl border border-[#ddd] bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-[#ff6a00]">CATEGORY EDIT</p>
            <h1 className="mt-1 text-xl font-black">카테고리 수정</h1>
          </div>
          <Link href="/admin" className="border border-[#ddd] px-3 py-2 text-[9px] font-black">
            돌아가기
          </Link>
        </div>

        {query.error === "has-sites" && (
          <div className="mt-4 border border-[#ffd7d1] bg-[#fff5f3] px-3 py-2 text-[10px] font-bold text-[#c94d39]">
            이 카테고리에 사이트가 남아 있어 삭제할 수 없습니다. 사이트를 다른 카테고리로 옮기거나 먼저 삭제하세요.
          </div>
        )}

        <form action={updateCategory.bind(null, id)} className="mt-5 space-y-2">
          <input name="name" required defaultValue={category.name} placeholder="카테고리명" className="admin-input" />
          <input name="icon" defaultValue={category.icon} placeholder="아이콘 문자" className="admin-input" />
          <input name="sortOrder" type="number" defaultValue={category.sortOrder} className="admin-input" />
          <button className="mt-3 h-11 w-full bg-[#4b5563] text-[10px] font-black text-white">
            수정 저장
          </button>
        </form>

        <div className="mt-5 border-t border-[#eee] pt-4">
          <p className="text-[9px] text-[#999]">현재 연결된 사이트 {category._count.sites}개</p>
          <form action={deleteCategory.bind(null, id)} className="mt-2">
            <button className="h-10 w-full border border-[#ffd7d1] bg-[#fff5f3] text-[9px] font-black text-[#c94d39]">
              카테고리 삭제
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
