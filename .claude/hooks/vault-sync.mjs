#!/usr/bin/env node
// Hook ‏PostToolUse (Write|Edit): מעדכן את הפתק המקביל ב-Vault/Architecture.
// קורא מ-stdin את ה-JSON של Claude Code ומשתמש ב-tool_input.file_path.
// לא רץ על Vault/ עצמה (מניעת לולאה), ולעולם לא מכשיל את הכלי: תמיד exit 0.
//
// שימוש ידני:
//   node .claude/hooks/vault-sync.mjs --all            ← מרענן את כל הפתקים
//   echo '{"tool_input":{"file_path":"src/features/tasks/actions.ts"}}' | node .claude/hooks/vault-sync.mjs

import path from "node:path";
import { fileURLToPath } from "node:url";

import { allNoteNames, noteForPath, syncNote, toRelative } from "./vault-sync-lib.mjs";

const projectRoot = process.env.CLAUDE_PROJECT_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    if (process.stdin.isTTY) return resolve("");
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
  });
}

async function main() {
  if (process.argv.includes("--all")) {
    for (const name of allNoteNames()) console.log(`${syncNote(projectRoot, name)}\t${name}`);
    return;
  }
  const raw = await readStdin();
  if (!raw.trim()) return;
  const input = JSON.parse(raw);
  const filePath = input?.tool_input?.file_path;
  if (!filePath) return;

  const rel = toRelative(path.resolve(projectRoot, filePath), projectRoot);
  const note = noteForPath(rel);
  if (!note) return;

  const result = syncNote(projectRoot, note);
  if (result !== "unchanged") console.log(`vault-sync: ${result} Vault/Architecture/${note}.md`);
}

main().catch((err) => {
  console.error(`vault-sync: ${err?.message ?? err}`);
}).finally(() => process.exit(0));
