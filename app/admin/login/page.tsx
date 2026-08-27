import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdmin()) redirect("/admin");

  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f4f6] p-5">
      <section className="w-full max-w-sm border border-[#ddd] bg-white p-6 shadow-sm">
        <p className="text-[10px] font-black tracking-[0.12em] text-[#ff6a00]">
          {BRAND.english} ADMIN
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.04em]">
          관리자 로그인
        </h1>
        <p className="mt-2 text-[11px] leading-5 text-[#888]">
          사이트, 카테고리, 광고 배너를 관리합니다.
        </p>

        {params.error === "1" && (
          <div className="mt-4 border border-[#ffd5ce] bg-[#fff4f1] px-3 py-2 text-[10px] font-bold text-[#c94732]">
            로그인 정보를 확인해주세요.
          </div>
        )}

        {params.error === "locked" && (
          <div className="mt-4 border border-[#ffd5ce] bg-[#fff4f1] px-3 py-2 text-[10px] font-bold text-[#c94732]">
            로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.
          </div>
        )}

        <form action="/api/admin/login" method="POST" className="mt-5">
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="관리자 비밀번호"
            className="h-11 w-full border border-[#d7d7d7] px-3 text-[12px] font-bold outline-none focus:border-[#ff6a00]"
          />
          <button className="mt-2 h-11 w-full bg-[#161616] text-[11px] font-black text-white">
            로그인
          </button>
        </form>
      </section>
    </main>
  );
}
