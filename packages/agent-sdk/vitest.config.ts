import { defineConfig } from "vitest/config";
import { vitestCucumber } from "@deepracticex/vitest-cucumber/plugin";
import path from "path";

export default defineConfig({
  plugins: [
    vitestCucumber({
      features: ["features/**/*.feature"],
      steps: "tests/steps",
      support: "tests/support",
    }),
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["**/*.feature", "**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true, // Run tests sequentially to avoid race conditions
      },
    },
    env: {
      PATH: process.env.PATH,
      NODE_ENV: "test",
    },
    server: {
      deps: {
        inline: ["ws"], // Inline ws to avoid module resolution issues
      },
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/index.ts", "src/types/**"],
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    testTimeout: 60000, // 60s for Claude API calls
    hookTimeout: 30000,
  },
});
