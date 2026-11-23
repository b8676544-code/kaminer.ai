// לוגיקה טהורה של סנכרון הקוד לפתקי Vault/Architecture.
// משמשת את vault-sync.mjs (ה-hook) ואת tests/vault-sync.test.ts.

import fs from "node:fs";
import path from "node:path";

export const AUTO_START = "<!-- auto:start -->";
export const AUTO_END = "<!-- auto:end -->";

/** שמות עבריים לתחומים ב-src/features. תחום שלא מופיע כאן מקבל את שמו באנגלית. */
const FEATURE_NOTES = {
  auth: "התחברות",
  clients: "לקוחות",
  freelancers: "פרילנסרים",
  tasks: "משימות",
  shared: "משותף",
  catalog: "קטלוג",
  calendar: "יומן",
  meetings: "יומן",
  time: "שעון",
  timer: "שעון",
  "time-entries": "שעון",
  google: "Google",
  settings: "הגדרות",
  today: "היום שלי",
};

const ROOT_CONFIG_FILES = new Set([
  "package.json",
  "next.config.ts",
  "tsconfig.json",
  "eslint.config.mjs",
  "vitest.config.ts",
  "postcss.config.mjs",
  "components.json",
  ".env.example",
  ".mcp.json",
  ".claude/settings.json",
]);

const IGNORED_SEGMENTS = ["node_modules/", ".next/", ".git/", "Vault/", "supabase/.temp/", "supabase/.branches/"];

const CODE_EXT = /\.(ts|tsx|mjs|js|sql|toml|md|json)$/;

/** נתיב יחסי לשורש הפרויקט עם "/" בלבד, או null אם הקובץ מחוץ לפרויקט. */
export function toRelative(filePath, projectRoot) {
  const norm = (p) => path.resolve(p).replace(/\\/g, "/");
  const file = norm(filePath);
  const root = norm(projectRoot).replace(/\/$/, "");
  const same = process.platform === "win32" ? (a, b) => a.toLowerCase() === b.toLowerCase() : (a, b) => a === b;
  const prefix = file.slice(0, root.length + 1);
  if (!same(prefix, root + "/")) return null;
  return file.slice(root.length + 1);
}

/** שם הפתק ב-Vault/Architecture שאחראי על הקובץ, או null אם לא ממפים אותו. */
export function noteForPath(rel) {
  if (!rel || IGNORED_SEGMENTS.some((s) => rel.startsWith(s) || rel.includes("/" + s))) return null;
  if (rel.endsWith(".gitkeep")) return null;

  if (ROOT_CONFIG_FILES.has(rel)) return "הגדרות פרויקט";

  const feature = rel.match(/^src\/features\/([^/]+)\//);
  if (feature) return FEATURE_NOTES[feature[1]] ?? feature[1];

  if (rel.startsWith("src/app/api/") || rel.startsWith("src/app/auth/") || rel.startsWith("supabase/functions/"))
    return "API";
  if (rel.startsWith("src/app/")) return "דפים";
  if (rel.startsWith("src/components/ui/")) return "רכיבי ui";
  if (rel.startsWith("src/components/")) return "רכיבי layout";
  if (rel.startsWith("src/lib/supabase/") || rel === "src/lib/auth.ts" || rel === "src/proxy.ts")
    return "Supabase ו-Auth";
  if (rel.startsWith("src/lib/google/")) return "Google";
  if (rel.startsWith("src/lib/")) return "משותף";
  if (rel.startsWith("src/types/")) return "מסד נתונים";
  if (rel.startsWith("supabase/migrations/") || rel === "supabase/seed.sql" || rel === "supabase/config.toml")
    return "מסד נתונים";
  if (rel.startsWith("tests/")) return "בדיקות";
  if (/^\.claude\/(agents|skills|commands|hooks)\//.test(rel)) return "תשתית Claude";
  if (rel.startsWith("src/")) return "לא ממופה";
  return null;
}

/** מה הקובץ "מציע": exports ב-TS, טבלאות ו-views ב-SQL, ‏name ב-frontmatter של md, נתיב לדפים. */
export function describeFile(rel, content) {
  const items = new Set();
  if (/\.(ts|tsx|mjs|js)$/.test(rel)) {
    const re = /export\s+(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g;
    for (const m of content.matchAll(re)) items.add(m[1]);
    for (const m of content.matchAll(/export\s+\{([^}]+)\}/g))
      m[1].split(",").forEach((n) => {
        const name = n.trim().split(/\s+as\s+/).pop();
        if (name) items.add(name);
      });
    if (/^export\s+default\s/m.test(content) && items.size === 0) items.add("default");
  } else if (rel.endsWith(".sql")) {
    const re = /create\s+(?:or\s+replace\s+)?(table|view|function|type|policy)\s+(?:if\s+not\s+exists\s+)?(?:"[^"]+"|[\w.]+)/gi;
    for (const m of content.matchAll(re)) {
      const kind = m[1].toLowerCase();
      if (kind === "policy") continue;
      const name = m[0].split(/\s+/).pop().replace(/^public\./, "").replace(/"/g, "");
      items.add(`${kind} ${name}`);
    }
  } else if (rel.endsWith(".md")) {
    const name = content.match(/^name:\s*(.+)$/m);
    if (name) items.add(name[1].trim());
  }
  const list = [...items];
  const route = routeFor(rel);
  return route ? [route, ...list.filter((n) => !/^(default|metadata|generateMetadata|viewport|dynamic|revalidate|.*Page|.*Layout)$/.test(n))] : list;
}

/** src/app/(app)/tasks/[id]/page.tsx → "/tasks/[id]" */
export function routeFor(rel) {
  const m = rel.match(/^src\/app\/((?:.*\/)?)(page|route|layout)\.tsx?$/);
  if (!m) return null;
  const segs = m[1]
    .split("/")
    .filter(Boolean)
    .filter((s) => !/^\(.*\)$/.test(s));
  const p = "/" + segs.join("/");
  return m[2] === "layout" ? `layout ${p}` : p;
}

function formatDate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** בונה את הבלוק האוטומטי. files: [{ rel, items }] */
export function buildAutoBlock(files, now = new Date()) {
  const sorted = [...files].sort((a, b) => a.rel.localeCompare(b.rel));
  const rows = sorted.map(({ rel, items }) => `| \`${rel}\` | ${items.length ? items.join(", ") : "—"} |`);
  return [
    AUTO_START,
    "## קבצים (מתעדכן אוטומטית)",
    `_עודכן: ${formatDate(now)} · ${sorted.length} קבצים. לא לערוך ידנית בין הסימונים._`,
    "",
    ...(rows.length ? ["| קובץ | מה יש בו |", "|---|---|", ...rows] : ["_אין עדיין קבצים באזור הזה._"]),
    AUTO_END,
  ].join("\n");
}

const withoutDate = (s) => s.replace(/^_עודכן: [^·]*·/m, "_עודכן ·");

/**
 * מחליף רק את הבלוק שבין הסימונים. כל מה שמחוץ להם (טקסט ו-wikilinks) נשמר.
 * מחזיר את התוכן הקיים כמו שהוא אם רק התאריך השתנה, כדי לא ללכלך את git.
 */
export function replaceAutoBlock(note, block) {
  const start = note.indexOf(AUTO_START);
  const end = note.indexOf(AUTO_END);
  if (start === -1 || end === -1 || end < start) return note.replace(/\s*$/, "\n\n") + block + "\n";
  const current = note.slice(start, end + AUTO_END.length);
  if (withoutDate(current) === withoutDate(block)) return note;
  return note.slice(0, start) + block + note.slice(end + AUTO_END.length);
}

/** פתק חדש לאזור שעוד אין לו פתק (למשל תחום חדש ב-src/features). */
export function newNoteTemplate(name, block, now = new Date()) {
  const iso = now.toISOString().slice(0, 10);
  return [
    "---",
    "type: architecture",
    `date: ${iso}`,
    "tags:",
    "  - architecture",
    "---",
    "",
    `# ${name}`,
    "",
    "> פתק שנוצר אוטומטית מה-hook. כדאי להשלים כאן תפקיד וקשרים.",
    "",
    "## תפקיד",
    "",
    "## קשרים",
    "- [[ארכיטקטורה]]",
    "",
    block,
    "",
  ].join("\n");
}

/** כל קבצי הפרויקט שממופים לפתק מסוים. */
export function filesForNote(projectRoot, noteName) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      const rel = toRelative(abs, projectRoot);
      if (!rel) continue;
      if (entry.isDirectory()) {
        if (IGNORED_SEGMENTS.some((s) => (rel + "/").startsWith(s))) continue;
        walk(abs);
      } else if (CODE_EXT.test(entry.name) && noteForPath(rel) === noteName) {
        out.push({ rel, items: describeFile(rel, fs.readFileSync(abs, "utf8")) });
      }
    }
  };
  for (const top of ["src", "supabase", "tests", ".claude"]) {
    const abs = path.join(projectRoot, top);
    if (fs.existsSync(abs)) walk(abs);
  }
  for (const rel of ROOT_CONFIG_FILES) {
    if (rel.includes("/")) continue;
    const abs = path.join(projectRoot, rel);
    if (noteName === "הגדרות פרויקט" && fs.existsSync(abs)) out.push({ rel, items: [] });
  }
  return out;
}

/** מעדכן (או יוצר) את הפתק של האזור. מחזיר "created" / "updated" / "unchanged". */
export function syncNote(projectRoot, noteName, now = new Date()) {
  const notePath = path.join(projectRoot, "Vault", "Architecture", `${noteName}.md`);
  const block = buildAutoBlock(filesForNote(projectRoot, noteName), now);
  if (!fs.existsSync(notePath)) {
    fs.mkdirSync(path.dirname(notePath), { recursive: true });
    fs.writeFileSync(notePath, newNoteTemplate(noteName, block, now), "utf8");
    return "created";
  }
  const current = fs.readFileSync(notePath, "utf8");
  const next = replaceAutoBlock(current, block);
  if (next === current) return "unchanged";
  fs.writeFileSync(notePath, next, "utf8");
  return "updated";
}

/** כל שמות הפתקים שיש להם קבצים כרגע (לשימוש ב- --all). */
export function allNoteNames() {
  return [
    "דפים", "API", "התחברות", "לקוחות", "פרילנסרים", "משימות", "משותף",
    "רכיבי layout", "רכיבי ui", "Supabase ו-Auth", "Google", "מסד נתונים",
    "בדיקות", "תשתית Claude", "הגדרות פרויקט",
  ];
}
