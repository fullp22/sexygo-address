import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const excludedDirs = new Set([
  "node_modules",
  ".next",
  ".git",
  ".backup",
  "public/uploads",
]);

const excludedFiles = new Set([
  ".env",
  "dev.db",
]);

const encodedForbidden = [
  "SGlnaFRlY2g=",
  "TWluMDUxODMyMw==",
  "cmFrOTg5ODc=",
  "cmFrMTI0MA==",
  "dGFlYmFla29u",
  "dGFlYmFla29uLXBsYXRmb3Jt",
  "cmVnaW9ub24=",
];

const forbidden = encodedForbidden.map((value) =>
  Buffer.from(value, "base64").toString("utf8"),
);

const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".css",
  ".scss",
  ".html",
  ".txt",
  ".yml",
  ".yaml",
  ".toml",
  ".prisma",
]);

const findings = [];
const cleanupWarnings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      if (
        excludedDirs.has(entry.name) ||
        excludedDirs.has(rel)
      ) {
        continue;
      }

      walk(full);
      continue;
    }

    if (excludedFiles.has(entry.name)) continue;

    if (
      entry.name.endsWith(".ps1") &&
      (entry.name.startsWith("eodigo_") || entry.name.startsWith("portal_"))
    ) {
      cleanupWarnings.push(rel);
      continue;
    }

    if (!textExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    const text = fs.readFileSync(full, "utf8");

    for (const token of forbidden) {
      if (text.toLowerCase().includes(token.toLowerCase())) {
        findings.push({ file: rel, token });
      }
    }
  }
}

walk(root);

console.log("");
console.log("EODIGO DELIVERY PREFLIGHT");
console.log("-------------------------");

if (findings.length > 0) {
  console.error("FAIL: identity/legacy strings were found.");
  for (const finding of findings) {
    console.error(`- ${finding.file}`);
  }
  process.exitCode = 1;
} else {
  console.log("PASS: no known identity/legacy strings found in source files.");
}

if (fs.existsSync(path.join(root, ".env"))) {
  console.log("NOTE: .env exists locally. Keep it out of the delivery archive.");
}

if (fs.existsSync(path.join(root, "prisma", "dev.db"))) {
  console.log("NOTE: local SQLite database exists. Do not treat it as production DB.");
}

if (cleanupWarnings.length > 0) {
  console.log("NOTE: installer patch files are present and should be removed before final handoff:");
  for (const file of cleanupWarnings) {
    console.log(`- ${file}`);
  }
}

console.log("");
