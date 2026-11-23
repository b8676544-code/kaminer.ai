// מפעיל את `next dev` כש-Node סומך על מאגר התעודות של מערכת ההפעלה.
// ברשת עם סינון או פרוקסי שחותם את תעבורת ה-HTTPS בתעודה משלו, Node בלי זה
// נכשל בקריאות לשירותים חיצוניים (Google OAuth/Calendar) עם SELF_SIGNED_CERT_IN_CHAIN.
// NODE_USE_SYSTEM_CA עובר בירושה גם לתהליך השרת ש-next dev מפעיל.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, NODE_USE_SYSTEM_CA: "1" },
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
