import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const data = [
  ["포털", "⌕", [
    ["네이버", "https://www.naver.com", "#03c75a"],
    ["Google", "https://www.google.com", "#4285f4"],
    ["다음", "https://www.daum.net", "#4b6cff"],
    ["Bing", "https://www.bing.com", "#008373"],
    ["Nate", "https://www.nate.com", "#ef3f43"],
  ]],
  ["영상", "▶", [
    ["YouTube", "https://www.youtube.com", "#ff0000"],
    ["Netflix", "https://www.netflix.com", "#e50914"],
    ["Twitch", "https://www.twitch.tv", "#9146ff"],
    ["치지직", "https://chzzk.naver.com", "#00b578"],
    ["SOOP", "https://www.sooplive.co.kr", "#1769ff"],
  ]],
  ["커뮤니티", "◉", [
    ["디시인사이드", "https://www.dcinside.com", "#3b65a7"],
    ["에펨코리아", "https://www.fmkorea.com", "#1d5eaa"],
    ["루리웹", "https://www.ruliweb.com", "#2556d8"],
    ["더쿠", "https://theqoo.net", "#43a047"],
    ["인스티즈", "https://www.instiz.net", "#8e44ad"],
  ]],
  ["쇼핑", "▣", [
    ["쿠팡", "https://www.coupang.com", "#e51b23"],
    ["G마켓", "https://www.gmarket.co.kr", "#00a64f"],
    ["11번가", "https://www.11st.co.kr", "#ff1744"],
    ["옥션", "https://www.auction.co.kr", "#e53935"],
    ["SSG", "https://www.ssg.com", "#ff5a5f"],
  ]],
  ["뉴스", "N", [
    ["네이버뉴스", "https://news.naver.com", "#03c75a"],
    ["연합뉴스", "https://www.yna.co.kr", "#2864dc"],
    ["중앙일보", "https://www.joongang.co.kr", "#222222"],
    ["한겨레", "https://www.hani.co.kr", "#ff6b00"],
    ["BBC", "https://www.bbc.com", "#bb1919"],
  ]],
  ["게임", "G", [
    ["Steam", "https://store.steampowered.com", "#1b2838"],
    ["넥슨", "https://www.nexon.com", "#2b2b2b"],
    ["라이엇게임즈", "https://www.riotgames.com", "#d13639"],
    ["블리자드", "https://www.blizzard.com", "#148eff"],
    ["메이플스토리", "https://maplestory.nexon.com", "#ff8a00"],
  ]],
  ["스포츠", "S", [
    ["네이버스포츠", "https://sports.naver.com", "#03c75a"],
    ["SPOTV", "https://www.spotvnow.co.kr", "#e60012"],
    ["ESPN", "https://www.espn.com", "#cc0000"],
    ["KBO", "https://www.koreabaseball.com", "#153d7a"],
    ["FIFA", "https://www.fifa.com", "#326295"],
  ]],
  ["금융", "₩", [
    ["토스", "https://toss.im", "#3182f6"],
    ["네이버페이", "https://pay.naver.com", "#03c75a"],
    ["카카오페이", "https://www.kakaopay.com", "#ffca28"],
    ["KB국민은행", "https://www.kbstar.com", "#ffbc00"],
    ["신한은행", "https://bank.shinhan.com", "#0046ff"],
  ]],
  ["취업", "W", [
    ["사람인", "https://www.saramin.co.kr", "#2f66ff"],
    ["잡코리아", "https://www.jobkorea.co.kr", "#2161dc"],
    ["원티드", "https://www.wanted.co.kr", "#111111"],
    ["워크24", "https://www.work24.go.kr", "#246bd8"],
    ["알바몬", "https://www.albamon.com", "#ff7a00"],
  ]],
  ["부동산", "⌂", [
    ["네이버부동산", "https://new.land.naver.com", "#03c75a"],
    ["직방", "https://www.zigbang.com", "#ff6b00"],
    ["다방", "https://www.dabangapp.com", "#2f65dc"],
    ["호갱노노", "https://hogangnono.com", "#ff665d"],
    ["KB부동산", "https://kbland.kr", "#ffbc00"],
  ]],
  ["여행", "✈", [
    ["네이버여행", "https://travel.naver.com", "#03c75a"],
    ["야놀자", "https://www.yanolja.com", "#ff3478"],
    ["여기어때", "https://www.goodchoice.kr", "#ff3b30"],
    ["아고다", "https://www.agoda.com", "#5392f9"],
    ["트립닷컴", "https://kr.trip.com", "#287dfa"],
  ]],
  ["생활", "●", [
    ["날씨", "https://weather.naver.com", "#4a90e2"],
    ["지도", "https://map.naver.com", "#03c75a"],
    ["번역", "https://papago.naver.com", "#14b8a6"],
    ["우체국", "https://www.epost.go.kr", "#e53935"],
    ["정부24", "https://www.gov.kr", "#2563eb"],
  ]],
];

for (let c = 0; c < data.length; c++) {
  const [name, icon, siteItems] = data[c];
  const category = await prisma.category.upsert({
    where: { name },
    update: { icon, sortOrder: c },
    create: { name, icon, sortOrder: c },
  });

  const existing = await prisma.site.count({ where: { categoryId: category.id } });
  if (existing === 0) {
    for (let i = 0; i < siteItems.length; i++) {
      const [siteName, url, color] = siteItems[i];
      await prisma.site.create({
        data: {
          name: siteName,
          url,
          color,
          sortOrder: i,
          categoryId: category.id,
        },
      });
    }
  }
}

// Remove only the temporary placeholder ads from the previous starter version.
// Real ads added by the administrator are preserved.
await prisma.banner.deleteMany({
  where: {
    linkUrl: "https://example.com",
    title: { startsWith: "광고 배너" },
  },
});

await prisma.siteSetting.upsert({
  where: { id: 1 },
  update: {},
  create: {
    id: 1,
    telegramSupportUrl: "",
  },
});

console.log("Seed complete.");
await prisma.$disconnect();
