import { createServer } from "vite";
const s = await createServer({ logLevel: "silent", server: { middlewareMode: true } });
for (const f of ["/src/content/markdown-content.md", "/src/data/posts.ts", "/src/routes/blog/[slug].tsx"]) {
  try { const r = await s.transformRequest(f, { ssr: true }); console.log("OK", f); if (f.endsWith("posts.ts")) console.log(r.code.slice(-900)); } catch (e) { console.log("FAIL", f, String(e.message).slice(0, 200)); const r = await s.transformRequest(f).catch(()=>null); console.log(r?.code?.slice(0, 1500)); }
}
await s.close();
