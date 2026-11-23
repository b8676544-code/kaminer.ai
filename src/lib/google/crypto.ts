import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// הצפנת refresh token של Google לפני שמירה ב-DB: ‏AES-256-GCM.
// פורמט: v1:<iv>:<tag>:<data>, כל חלק ב-base64. ה-tag מזהה כל שינוי בטקסט המוצפן.
const VERSION = "v1";
const IV_BYTES = 12;

export function parseEncryptionKey(value: string | undefined): Buffer {
  if (!value) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY חסר");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY חייב להיות 32 בתים ב-base64");
  return key;
}

export function getEncryptionKey(): Buffer {
  return parseEncryptionKey(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY);
}

export function encryptToken(plain: string, key: Buffer = getEncryptionKey()): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), data.toString("base64")].join(":");
}

export function decryptToken(encrypted: string, key: Buffer = getEncryptionKey()): string {
  const [version, iv, tag, data] = encrypted.split(":");
  if (version !== VERSION || !iv || !tag || !data) throw new Error("טוקן מוצפן בפורמט לא מוכר");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
