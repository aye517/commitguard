import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.{ts,tsx}", "apps/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "dist"],
  },
  resolve: {
    alias: {
      "@commitguard/core": resolve(__dirname, "packages/core/src/index.ts"),
      "@commitguard/git": resolve(__dirname, "packages/git/src/index.ts"),
      "@commitguard/config": resolve(__dirname, "packages/config/src/index.ts"),
      "@commitguard/ai": resolve(__dirname, "packages/ai/src/index.ts"),
    },
  },
});
