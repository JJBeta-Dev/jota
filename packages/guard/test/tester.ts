import { afterAll, describe, it } from "vitest";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

// Wire ESLint's RuleTester to Vitest (these statics exist at runtime but are not in the types).
Object.assign(RuleTester, { afterAll, describe, it, itOnly: it.only });

export const tester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});
