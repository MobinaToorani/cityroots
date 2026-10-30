import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "CatchClause[body.body.length=0]",
          message: "No silent catch. Log the error with the logger or rethrow.",
        },
      ],
    },
  },
  {
    // The logger is the one place allowed to write to the console.
    files: ["src/lib/logger.ts", "scripts/**/*.ts"],
    rules: { "no-console": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".data/**",
    "drizzle/**",
    ".lighthouseci/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
