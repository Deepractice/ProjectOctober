/**
 * ESLint Configuration for Agent SDK
 * Enforces layered architecture and coding standards
 */

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: await import("@typescript-eslint/parser"),
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": await import("@typescript-eslint/eslint-plugin").then(m => m.default),
      "sdk-arch": (await import("./lint/index.mjs")).default,
    },
    rules: {
      // Architecture Rules
      "sdk-arch/layer-dependency": "error",
      "sdk-arch/file-naming": "warn",
      "sdk-arch/api-exports": "error",

      // TypeScript Rules
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];
