import type { Rule } from "eslint";
import { docsUrl } from "./docs.js";

interface RuleOptions {
  id: string;
  level: "error" | "warn";
  description: string;
  messages: Record<string, string>;
  /** True when the rule can repair the code itself (`jota-guard --fix`). */
  fixable?: boolean;
  create: (context: Rule.RuleContext) => Rule.RuleListener;
}

export function createRule(options: RuleOptions): Rule.RuleModule {
  return {
    meta: {
      type: options.level === "error" ? "problem" : "suggestion",
      docs: {
        description: options.description,
        url: docsUrl(options.id, options.level),
      },
      schema: [],
      ...(options.fixable ? { fixable: "code" as const } : {}),
      messages: options.messages,
    },
    create: options.create,
  };
}
