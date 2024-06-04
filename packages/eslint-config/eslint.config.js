import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";
import prettierPlugin from "eslint-plugin-prettier";
import sonarjs from "eslint-plugin-sonarjs";
import path from "path";
import tsEslint from "typescript-eslint";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default tsEslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.svelte-kit/**",
      "**/*.config.{js,ts,mjs,cjs}",
      "**/__generated__/**",
    ],
  },
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  // prettier
  {
    plugins: {
      prettier: prettierPlugin,
    },
  },
  // drizzle
  ...compat.config({
    plugins: ["drizzle"],
    extends: ["plugin:drizzle/recommended"],
    rules: {
      "drizzle/enforce-delete-with-where": [
        "error",
        {
          drizzleObjectName: "db",
        },
      ],
      "drizzle/enforce-update-with-where": [
        "error",
        {
          drizzleObjectName: "db",
        },
      ],
    },
  }),
  sonarjs.configs.recommended,
  {
    rules: {
      ...Object.keys(sonarjs.rules).reduce((acc, rule) => {
        acc[`sonarjs/${rule}`] = "warn";
        return acc;
      }, {}),
    },
  }
);