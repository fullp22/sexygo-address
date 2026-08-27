import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function write(rel, text) {
  fs.writeFileSync(path.join(root, rel), text, "utf8");
}
function ensureImport(text, line, afterPattern) {
  if (text.includes(line)) return text;
  const match = text.match(afterPattern);
  if (!match) throw new Error(`Could not find import insertion point for ${line}`);
  return text.replace(match[0], `${match[0]}\n${line}`);
}

// 1) KST parsing in admin actions.
{
  const rel = "app/admin/actions.ts";
  let text = read(rel);

  text = ensureImport(
    text,
    'import { parseKstDateTime } from "@/lib/kst";',
    /^import .*;$/m,
  );

  let replacements = 0;

  text = text.replace(
    /new Date\(([^()\n]*(?:startAt|start|startRaw)[^()\n]*)\)/gi,
    (_m, inner) => {
      replacements += 1;
      return `parseKstDateTime(${inner})!`;
    },
  );
  text = text.replace(
    /new Date\(([^()\n]*(?:endAt|end|endRaw)[^()\n]*)\)/gi,
    (_m, inner) => {
      replacements += 1;
      return `parseKstDateTime(${inner})!`;
    },
  );

  if (replacements === 0 && !text.includes("parseKstDateTime(")) {
    throw new Error("No start/end Date parsing pattern found in app/admin/actions.ts");
  }

  write(rel, text);
}

// 2) KST formatting in banner edit/admin pages when ISO slice is used.
for (const rel of ["app/admin/banner/[id]/page.tsx", "app/admin/page.tsx"]) {
  if (!fs.existsSync(path.join(root, rel))) continue;
  let text = read(rel);

  if (/toISOString\(\)\.slice\(0,\s*16\)/.test(text)) {
    text = ensureImport(
      text,
      'import { formatKstDateTimeInput, formatKstDateTime } from "@/lib/kst";',
      /^import .*;$/m,
    );

    text = text.replace(
      /banner\.startAt\s*\?\s*banner\.startAt\.toISOString\(\)\.slice\(0,\s*16\)\s*:\s*""/g,
      'formatKstDateTimeInput(banner.startAt)',
    );
    text = text.replace(
      /banner\.endAt\s*\?\s*banner\.endAt\.toISOString\(\)\.slice\(0,\s*16\)\s*:\s*""/g,
      'formatKstDateTimeInput(banner.endAt)',
    );
  }

  write(rel, text);
}

// 3) Mount exact schedule refresh globally. Harmless on admin pages.
{
  const rel = "app/layout.tsx";
  let text = read(rel);

  text = ensureImport(
    text,
    'import AdScheduleSync from "@/components/AdScheduleSync";',
    /^import .*;$/m,
  );

  if (!text.includes("<AdScheduleSync")) {
    if (!text.includes("{children}")) {
      throw new Error("Could not find {children} in app/layout.tsx");
    }
    text = text.replace("{children}", "<AdScheduleSync />\n        {children}");
  }

  write(rel, text);
}

console.log("V16 source patch completed.");
