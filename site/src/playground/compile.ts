import "./shims";
import { transformJota } from "vite-plugin-jota";

export interface CompileResult {
  code?: string;
  error?: string;
}

/**
 * Compile a TSX snippet with the same compiler that `vite-plugin-jota` uses at build time.
 * This module is imported lazily by the playground page, so the compiler (about 1 MB) is only
 * downloaded when someone opens the playground.
 */
export async function compileSnippet(source: string): Promise<CompileResult> {
  try {
    const result = await transformJota(source, "snippet.tsx");
    if (!result) return { error: "Nothing was produced." };
    return { code: result.code };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    /** Babel prefixes messages with the file name; drop it so the message starts at the problem. */
    return { error: message.replace(/^snippet\.tsx:\s*/, "") };
  }
}

const escapeScript = (code: string): string => code.replace(/<\/script/gi, "<\\/script");

/** The document shown in the preview iframe. Imports of `jota-js` resolve to the runtime files of this site. */
export function previewDocument(code: string, origin: string): string {
  const imports = JSON.stringify({
    imports: { "jota-js": `${origin}/runtime/jota.js`, "jota-js/web": `${origin}/runtime/web.js` },
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>body{font-family:system-ui,sans-serif;margin:1rem;color:#1a0b3b}button{padding:.5rem 1rem;border:0;border-radius:999px;background:#6f3af8;color:#fff;font-weight:700;cursor:pointer}</style>
<script type="importmap">${imports}</script>
<script>
addEventListener("error", (event) => parent.postMessage({ type: "jota-playground-error", message: event.message }, "*"));
addEventListener("unhandledrejection", (event) => parent.postMessage({ type: "jota-playground-error", message: String(event.reason) }, "*"));
</script>
</head>
<body>
<div id="app"></div>
<script type="module">
${escapeScript(code)}
parent.postMessage({ type: "jota-playground-ready" }, "*");
</script>
</body>
</html>`;
}
