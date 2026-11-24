// LAW-6: גיבוי מוצפן של ה-DB המקומי (Supabase ב-Docker), כל עוד המערכת רצה על המחשב.
//
// גיבוי:   npm run db:backup
// שחזור:   node scripts/backup-local.mjs --decrypt <קובץ.kmb> <קובץ-יעד.dump>
//          ואחר כך pg_restore לתוך ה-DB (docs/security/database-definition.md, "גיבוי ושחזור")
//
// הגדרות ב-.env:
//   LOCAL_BACKUP_PASSPHRASE — חובה. בלעדיה אי אפשר לשחזר, לשמור גם מחוץ למחשב
//   LOCAL_BACKUP_DIR        — לא חובה. ברירת מחדל: kaminer-backups בתיקיית המשתמש
// נשמרים 30 יום. הקובץ: AES-256-GCM, מפתח מ-scrypt על הסיסמה.

import { execFileSync } from "node:child_process";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONTAINER = "supabase_db_kaminer-ai";
const MAGIC = Buffer.from("KMB1");
const KEEP_DAYS = 30;

if (existsSync(".env")) process.loadEnvFile(".env");

const passphrase = process.env.LOCAL_BACKUP_PASSPHRASE;
if (!passphrase || passphrase.length < 12) {
  console.error("חסר LOCAL_BACKUP_PASSPHRASE ב-.env (לפחות 12 תווים).");
  process.exit(1);
}

const keyFor = (salt) => scryptSync(passphrase, salt, 32);

function encrypt(plain) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFor(salt), iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([MAGIC, salt, iv, body, cipher.getAuthTag()]);
}

function decrypt(file) {
  if (!file.subarray(0, 4).equals(MAGIC)) throw new Error("הקובץ אינו גיבוי של המערכת");
  const salt = file.subarray(4, 20);
  const iv = file.subarray(20, 32);
  const tag = file.subarray(file.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", keyFor(salt), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(file.subarray(32, file.length - 16)), decipher.final()]);
}

if (process.argv[2] === "--decrypt") {
  const [, , , input, output] = process.argv;
  if (!input || !output) {
    console.error("שימוש: node scripts/backup-local.mjs --decrypt <קובץ.kmb> <קובץ-יעד.dump>");
    process.exit(1);
  }
  try {
    writeFileSync(output, decrypt(readFileSync(input)));
  } catch {
    console.error("הפענוח נכשל: סיסמה שגויה או קובץ פגום.");
    process.exit(1);
  }
  console.log(`פוענח אל ${output}`);
  process.exit(0);
}

const dir = process.env.LOCAL_BACKUP_DIR || join(homedir(), "kaminer-backups");
mkdirSync(dir, { recursive: true });

// public: נתוני העסק. auth: המשתמשת (הנתונים ב-public מפנים אליה). פורמט custom לשחזור עם pg_restore
const dump = execFileSync(
  "docker",
  ["exec", CONTAINER, "pg_dump", "-U", "postgres", "-d", "postgres", "-Fc", "-n", "public", "-n", "auth"],
  { maxBuffer: 1024 * 1024 * 1024 },
);

const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
const target = join(dir, `kaminer-db-${stamp}.kmb`);
writeFileSync(target, encrypt(dump));
console.log(`נשמר גיבוי מוצפן: ${target} (${Math.round(dump.length / 1024)}KB לפני הצפנה)`);

const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
for (const name of readdirSync(dir)) {
  if (!/^kaminer-db-\d{12}\.kmb$/.test(name)) continue;
  const path = join(dir, name);
  if (statSync(path).mtimeMs < cutoff) {
    unlinkSync(path);
    console.log(`נמחק גיבוי ישן: ${name}`);
  }
}
