"use client";

import { ChangeEvent, useState } from "react";

export default function MediaUploadField({
  kind,
  name,
  initialUrl = "",
}: {
  kind: "image" | "video";
  name: string;
  initialUrl?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const accept =
    kind === "video"
      ? "video/mp4,video/webm"
      : "image/jpeg,image/png,image/webp,image/gif";

  async function upload(file: File) {
    setBusy(true);
    setStatus("업로드 중...");

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });

      const result = await response.json();

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Upload failed");
      }

      setUrl(result.url);
      setStatus("업로드 완료");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void upload(file);
  }

  return (
    <div className="border border-[#e2e2e2] bg-[#fafafa] p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-black text-[#666]">
          {kind === "video" ? "영상" : "이미지/포스터"}
        </span>
        <span className={`text-[8px] font-bold ${status === "업로드 완료" ? "text-[#29924d]" : "text-[#999]"}`}>
          {status}
        </span>
      </div>

      <input
        type="file"
        accept={accept}
        disabled={busy}
        onChange={onChange}
        className="mt-2 block w-full text-[9px] file:mr-2 file:border-0 file:bg-[#161616] file:px-2.5 file:py-2 file:text-[8px] file:font-black file:text-white"
      />

      <input
        type="text"
        name={name}
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder={kind === "video" ? "또는 MP4/WebM URL 직접 입력" : "또는 이미지 URL 직접 입력"}
        className="admin-input mt-2"
      />

      {url && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="truncate text-[8px] text-[#999]">{url}</span>
          <button
            type="button"
            onClick={() => {
              setUrl("");
              setStatus("");
            }}
            className="shrink-0 border border-[#ddd] bg-white px-2 py-1 text-[8px] font-black text-[#777]"
          >
            비우기
          </button>
        </div>
      )}
    </div>
  );
}
