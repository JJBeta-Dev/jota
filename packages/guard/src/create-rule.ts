import type { Rule } from "eslint";
import { docsUrl } from "./docs.js";

interface RuleOptions {
  id: string;
  level: "error" | "warn";
  description: string;
  messages: Record<string, string>;
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
      messages: options.messages,
    },
    create: options.create,
  };
}
