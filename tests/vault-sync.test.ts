import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  AUTO_END,
  AUTO_START,
  buildAutoBlock,
  describeFile,
  noteForPath,
  replaceAutoBlock,
  routeFor,
  syncNote,
  toRelative,
} from "../.claude/hooks/vault-sync-lib.mjs";

describe("noteForPath", () => {
  it.each([
    ["src/features/tasks/actions.ts", "משימות"],
    ["src/features/clients/queries.ts", "לקוחות"],
    ["src/features/catalog/actions.ts", "קטלוג"],
    ["src/features/reports/queries.ts", "reports"],
    ["src/app/(app)/tasks/page.tsx", "דפים"],
    ["src/app/api/google/sync/route.ts", "API"],
    ["src/app/auth/callback/route.ts", "API"],
    ["src/lib/supabase/server.ts", "Supabase ו-Auth"],
    ["src/proxy.ts", "Supabase ו-Auth"],
    ["src/lib/google/oauth.ts", "Google"],
    ["supabase/migrations/20261119120000_initial_schema.sql", "מסד נתונים"],
    ["tests/format.test.ts", "בדיקות"],
    [".claude/agents/reviewer.md", "תשתית Claude"],
    ["package.json", "הגדרות פרויקט"],
  ])("%s → %s", (rel, note) => {
    expect(noteForPath(rel)).toBe(note);
  });

  it("ignores Vault, build output and non-code files", () => {
    expect(noteForPath("Vault/Architecture/משימות.md")).toBeNull();
    expect(noteForPath(".next/server/app.js")).toBeNull();
    expect(noteForPath("node_modules/next/index.js")).toBeNull();
    expect(noteForPath("CHECKLIST.md")).toBeNull();
    expect(noteForPath("docs/PRD.md")).toBeNull();
    expect(noteForPath(null)).toBeNull();
  });
});

describe("toRelative", () => {
  it("returns a forward-slash path inside the project and null outside", () => {
    const root = path.resolve("/proj/kaminer");
    expect(toRelative(path.join(root, "src", "a.ts"), root)).toBe("src/a.ts");
    expect(toRelative(path.resolve("/other/a.ts"), root)).toBeNull();
    expect(toRelative(path.resolve("/proj/kaminer-old/a.ts"), root)).toBeNull();
  });
});

describe("describeFile", () => {
  it("lists TS exports", () => {
    const src = "export async function createTask() {}\nexport const taskSchema = 1;\nexport type TaskInput = {};\nfunction hidden() {}";
    expect(describeFile("src/features/tasks/actions.ts", src)).toEqual(["createTask", "taskSchema", "TaskInput"]);
  });

  it("lists SQL tables and views, not policies", () => {
    const sql = "create table public.clients (id uuid);\ncreate or replace view public.task_time_summary as select 1;\ncreate policy \"own\" on clients;";
    expect(describeFile("supabase/migrations/x.sql", sql)).toEqual(["table clients", "view task_time_summary"]);
  });

  it("puts the route first for pages", () => {
    expect(describeFile("src/app/(app)/tasks/[id]/page.tsx", "export default async function TaskPage() {}")).toEqual([
      "/tasks/[id]",
    ]);
  });
});

describe("routeFor", () => {
  it.each([
    ["src/app/(app)/page.tsx", "/"],
    ["src/app/(app)/clients/[id]/page.tsx", "/clients/[id]"],
    ["src/app/auth/callback/route.ts", "/auth/callback"],
    ["src/app/(app)/layout.tsx", "layout /"],
    ["src/app/(app)/homepage.tsx", null],
  ])("%s → %s", (rel, route) => {
    expect(routeFor(rel)).toBe(route);
  });
});

describe("replaceAutoBlock", () => {
  const note = `# משימות\n\nטקסט ידני עם [[לקוחות]].\n\n${AUTO_START}\nישן\n${AUTO_END}\n\n## הערות\n[[מסד נתונים]]\n`;

  it("replaces only the block and keeps manual text and links", () => {
    const block = buildAutoBlock([{ rel: "src/features/tasks/actions.ts", items: ["createTask"] }]);
    const out = replaceAutoBlock(note, block);
    expect(out).toContain("טקסט ידני עם [[לקוחות]].");
    expect(out).toContain("## הערות\n[[מסד נתונים]]");
    expect(out).toContain("createTask");
    expect(out).not.toContain("ישן");
  });

  it("does not rewrite when only the date changed", () => {
    const files = [{ rel: "a.ts", items: [] }];
    const first = replaceAutoBlock(note, buildAutoBlock(files, new Date(2026, 10, 19)));
    expect(replaceAutoBlock(first, buildAutoBlock(files, new Date(2026, 11, 1)))).toBe(first);
  });

  it("appends the block when markers are missing", () => {
    const out = replaceAutoBlock("# פתק\n", buildAutoBlock([]));
    expect(out.startsWith("# פתק\n\n" + AUTO_START)).toBe(true);
  });
});

describe("syncNote", () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "vault-sync-"));
    fs.mkdirSync(path.join(root, "src/features/tasks"), { recursive: true });
    fs.writeFileSync(path.join(root, "src/features/tasks/actions.ts"), "export function createTask() {}\n");
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it("creates a missing note, then keeps manual edits on update", () => {
    expect(syncNote(root, "משימות")).toBe("created");
    const notePath = path.join(root, "Vault/Architecture/משימות.md");
    fs.writeFileSync(notePath, fs.readFileSync(notePath, "utf8").replace("## תפקיד", "## תפקיד\nטקסט שלי [[לקוחות]]"));

    expect(syncNote(root, "משימות")).toBe("unchanged");
    fs.writeFileSync(path.join(root, "src/features/tasks/queries.ts"), "export const getTasks = 1;\n");
    expect(syncNote(root, "משימות")).toBe("updated");

    const out = fs.readFileSync(notePath, "utf8");
    expect(out).toContain("טקסט שלי [[לקוחות]]");
    expect(out).toContain("getTasks");
  });
});
