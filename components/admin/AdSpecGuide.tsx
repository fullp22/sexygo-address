const rows = [
  ["전체", "100%", "1200 × 400", "한 줄 전체"],
  ["1/2", "50%", "600 × 200", "한 줄 2개"],
  ["1/3", "33.33%", "400 × 134", "한 줄 3개"],
  ["1/4", "25%", "300 × 100", "한 줄 4개"],
];

export default function AdSpecGuide() {
  return (
    <section className="border border-[#ddd] bg-white p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-black">광고 배너 제작 규격</h2>
          <p className="mt-1 text-[9px] leading-4 text-[#888]">
            PC와 모바일 모두 같은 폭 비율을 유지합니다. 모든 배너 권장 화면비는 3:1입니다.
          </p>
        </div>
        <span className="bg-[#fff3e8] px-2 py-1 text-[8px] font-black text-[#ff6a00]">
          PC = MOBILE 동일 비율
        </span>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left">
          <thead>
            <tr className="bg-[#fafafa] text-[8px] font-black text-[#777]">
              <th className="border border-[#e5e5e5] px-2 py-2">규격</th>
              <th className="border border-[#e5e5e5] px-2 py-2">화면 폭</th>
              <th className="border border-[#e5e5e5] px-2 py-2">권장 원본 크기</th>
              <th className="border border-[#e5e5e5] px-2 py-2">배치</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, width, asset, note]) => (
              <tr key={label} className="text-[9px] font-bold">
                <td className="border border-[#e5e5e5] px-2 py-2">{label}</td>
                <td className="border border-[#e5e5e5] px-2 py-2">{width}</td>
                <td className="border border-[#e5e5e5] px-2 py-2">{asset}px · 3:1</td>
                <td className="border border-[#e5e5e5] px-2 py-2">{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid gap-2 text-[9px] leading-4 text-[#666] sm:grid-cols-2">
        <div className="border border-[#eee] bg-[#fafafa] p-3">
          <strong className="block text-[#222]">이미지</strong>
          WebP / JPG / PNG · 최대 5MB · 권장 1MB 이하 · sRGB · 3:1 비율 권장
        </div>
        <div className="border border-[#eee] bg-[#fafafa] p-3">
          <strong className="block text-[#222]">영상</strong>
          MP4(H.264) 권장 / WebM 지원 · 최대 20MB · 권장 8MB 이하 · 6~10초 · 24/30fps · 무음 루프
        </div>
      </div>

      <p className="mt-2 text-[8px] leading-4 text-[#999]">
        다른 비율의 파일도 등록은 가능하지만 배너 슬롯에 맞춰 잘릴 수 있으므로,
        광고주에게 위 규격 그대로 받는 것을 권장합니다.
      </p>
    </section>
  );
}
