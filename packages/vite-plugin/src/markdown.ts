import { Marked, type Tokens } from "marked";
import type { Plugin } from "vite";

export interface MarkdownHeading {
  depth: number;
  text: string;
  id: string;
}

export interface MarkdownOptions {
  /**
   * Accessibility checks on the content, in the spirit of Jota Guard. Default: true.
   * An image without alt text fails the build; a skipped heading level prints a warning.
   */
  guard?: boolean;
  /** Turn a code block into HTML (for example with Shiki). Return undefined to keep the default. */
  highlight?: (code: string, language: string) => string | undefined;
}

export interface MarkdownProblem {
  level: "error" | "warn";
  message: string;
}

export interface MarkdownResult {
  html: string;
  frontmatter: Record<string, unknown>;
  headings: MarkdownHeading[];
  problems: MarkdownProblem[];
}

const FRONTMATTER = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseScalar(raw: string): unknown {
  const value = raw.trim();
  if (value === "") return "";
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~") return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  const quoted = /^(["'])([\s\S]*)\1$/.exec(value);
  if (quoted) return quoted[2];
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    return inner === "" ? [] : inner.split(",").map(parseScalar);
  }
  return value;
}

/**
 * Read the small subset of YAML that front matter needs: `key: value` lines with strings, numbers,
 * booleans, inline lists (`[a, b]`) and dash lists. Anything richer belongs in a data file.
 */
export function parseFrontmatter(source: string): { data: Record<string, unknown>; body: string } {
  const match = FRONTMATTER.exec(source);
  if (!match) return { data: {}, body: source };
  const data: Record<string, unknown> = {};
  let listKey: string | undefined;
  for (const line of (match[1] ?? "").split(/\r?\n/)) {
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && listKey !== undefined) {
      (data[listKey] as unknown[]).push(parseScalar(item[1] ?? ""));
      continue;
    }
    const pair = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!pair) throw new Error(`Front matter: cannot read the line "${line.trim()}". Use "key: value".`);
    const key = pair[1] as string;
    const rest = pair[2] ?? "";
    if (rest.trim() === "") {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = parseScalar(rest);
      listKey = undefined;
    }
  }
  return { data, body: source.slice(match[0].length) };
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function slugify(text: string, used: Map<string, number>): string {
  const base =
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

function plainText(tokens: Tokens.Generic[] | undefined): string {
  if (!tokens) return "";
  return tokens
    .map((token) => {
      const children = (token as { tokens?: Tokens.Generic[] }).tokens;
      if (children) return plainText(children);
      return typeof token.text === "string" ? token.text : "";
    })
    .join("");
}

/** Compile one Markdown document. Exposed separately from the Vite plugin so it can be tested and reused. */
export function compileMarkdown(source: string, options: MarkdownOptions = {}): MarkdownResult {
  const { data, body } = parseFrontmatter(source);
  const headings: MarkdownHeading[] = [];
  const problems: MarkdownProblem[] = [];
  const used = new Map<string, number>();
  const guard = options.guard !== false;
  const marked = new Marked({ gfm: true });

  marked.use({
    walkTokens(token) {
      if (!guard || token.type !== "image") return;
      const image = token as Tokens.Image;
      if (image.text.trim() === "") {
        problems.push({
          level: "error",
          message: `Image "${image.href}" has no alt text. Write ![what the image shows](${image.href}).`,
        });
      }
    },
    renderer: {
      heading(token) {
        const text = plainText(token.tokens as Tokens.Generic[]);
        const id = slugify(text, used);
        headings.push({ depth: token.depth, text, id });
        return `<h${token.depth} id="${id}">${this.parser.parseInline(token.tokens)}</h${token.depth}>\n`;
      },
      code(token) {
        const language = (token.lang ?? "").trim().split(/\s+/)[0] ?? "";
        const custom = options.highlight?.(token.text, language);
        if (custom !== undefined) return custom;
        const attribute = language ? ` class="language-${escapeHtml(language)}"` : "";
        return `<pre><code${attribute}>${escapeHtml(token.text)}</code></pre>\n`;
      },
    },
  });

  const html = marked.parse(body, { async: false });

  if (guard) {
    let previous = 0;
    for (const heading of headings) {
      if (previous !== 0 && heading.depth > previous + 1) {
        problems.push({
          level: "warn",
          message: `Heading "${heading.text}" jumps from level ${previous} to level ${heading.depth}. Do not skip levels.`,
        });
      }
      previous = heading.depth;
    }
    if (/<img\b(?![^>]*\balt=)[^>]*>/i.test(html)) {
      problems.push({ level: "error", message: "An <img> written as HTML has no alt attribute." });
    }
  }

  return { html, frontmatter: data, headings, problems };
}

/**
 * Vite plugin: `import Post, { frontmatter, headings, html } from "./post.md"`.
 * The default export is a component that renders the document inside a `<div>`; pass `class` to style it.
 * Collections need nothing new: `import.meta.glob("./posts/*.md", { eager: true })`.
 */
export function jotaMarkdown(options: MarkdownOptions = {}): Plugin {
  return {
    name: "vite-plugin-jota:markdown",
    enforce: "pre",
    transform(source, id) {
      const filename = id.split("?")[0] ?? id;
      if (!filename.endsWith(".md")) return null;
      let result: MarkdownResult;
      try {
        result = compileMarkdown(source, options);
      } catch (error) {
        this.error(`${filename}: ${error instanceof Error ? error.message : String(error)}`);
      }
      for (const problem of result.problems) {
        if (problem.level === "warn") this.warn(`${filename}: ${problem.message}`);
      }
      const errors = result.problems.filter((problem) => problem.level === "error");
      if (errors.length > 0) {
        this.error(`${filename}: ${errors.map((problem) => problem.message).join(" ")}`);
      }
      const code = [
        `export const html = ${JSON.stringify(result.html)};`,
        `export const frontmatter = ${JSON.stringify(result.frontmatter)};`,
        `export const headings = ${JSON.stringify(result.headings)};`,
        `export default function Content(props) {`,
        `  const element = document.createElement("div");`,
        `  const name = props && (props.class || props.className);`,
        `  if (name) element.className = name;`,
        `  element.innerHTML = html;`,
        `  return element;`,
        `}`,
      ].join("\n");
      return { code, map: null };
    },
  };
}
