const BASE = "https://github.com/JJBeta-Dev/jota/blob/main/docs/guard-rules.md";

/** Link to a rule's section; the anchor matches GitHub's slug of "### `jota/<id>` · <level>". */
export function docsUrl(id: string, level: "error" | "warn"): string {
  return `${BASE}#jota${id}--${level}`;
}
