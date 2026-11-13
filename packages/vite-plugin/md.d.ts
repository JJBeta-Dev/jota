/**
 * Types for Markdown imports. Add to a `.d.ts` file of your project:
 * `/// <reference types="vite-plugin-jota/md" />`
 */
declare module "*.md" {
  export const html: string;
  export const frontmatter: Record<string, unknown>;
  export const headings: Array<{ depth: number; text: string; id: string }>;
  const Content: (props?: { class?: string }) => HTMLDivElement;
  export default Content;
}
