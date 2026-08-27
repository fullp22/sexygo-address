const KST_OFFSET = "+09:00";

export function parseKstDateTime(value: unknown): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const hasZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(raw);
  const localValue = raw.length === 16 ? `${raw}:00` : raw;
  const date = new Date(hasZone ? raw : `${localValue}${KST_OFFSET}`);

  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatKstDateTimeInput(
  value: Date | string | null | undefined,
): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function formatKstDateTime(
  value: Date | string | null | undefined,
): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
