import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
      // בבדיקות אין סביבת react-server: מחליפים את סימון server-only בגרסה הריקה שלו,
      // כדי שאפשר יהיה לבדוק מודולים של צד השרת (כמו src/lib/google/crypto.ts)
      { find: /^server-only$/, replacement: fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)) },
    ],
  },
  test: {
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
