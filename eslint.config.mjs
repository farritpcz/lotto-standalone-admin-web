// ESLint config — admin-web
// Rules derived from: C:/project/lotto-system/docs/coding_standards.md
// Policy: hard rules = error (alert/confirm, new any), size rules = warn
// (many existing violations; fix boy-scout-style during refactor sprints).

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  {
    rules: {
      // ─── Hard rules (error) — from coding_standards §5 ──────────────
      "no-alert": "error",                                    // ban alert/confirm/prompt
      "@typescript-eslint/no-explicit-any": ["error", {       // ban new `any`
        ignoreRestArgs: true,
      }],
      "no-restricted-globals": ["error", "alert", "confirm", "prompt"],
      "no-console": ["error", { allow: ["warn", "error"] }],  // allow console.warn/error

      // ─── Size soft limits (warn) — §1 ───────────────────────────────
      "max-lines": ["warn", {
        max: 500,
        skipBlankLines: true,
        skipComments: true,
      }],
      "max-lines-per-function": ["warn", {
        max: 100,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true,
      }],

      // ─── Quality (warn) ────────────────────────────────────────────
      "no-debugger": "error",
      "prefer-const": "warn",
      "eqeqeq": ["warn", "smart"],
    },
  },

  // Relax for config + generated files
  {
    files: ["**/*.config.{js,mjs,ts}", "**/next.config.*"],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
    },
  },
]);

export default eslintConfig;
