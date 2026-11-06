import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const client = join(here, "dist", "client");
const shell = readFileSync(join(client, "index.html"), "utf8");
const { render } = await import(pathToFileURL(join(here, "dist", "server", "entry-server.js")).href);

const TYPES = { ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".html": "text/html" };

/** Put JSON inside a script tag without letting it close the tag. */
const safeJson = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

const server = createServer(async (request, response) => {
  const path = (request.url ?? "/").split("?")[0];
  const file = normalize(join(client, path));
  if (path !== "/" && file.startsWith(client) && existsSync(file) && statSync(file).isFile()) {
    response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    response.end(readFileSync(file));
    return;
  }
  const data = {
    title: "Jota on the server",
    renderedAt: new Date().toISOString(),
    posts: ["Signals without a virtual DOM", "Guard checks accessibility", "Hydration keeps your elements"],
  };
  const app = await render(data);
  const html = shell
    .replace("<!--app-->", () => app)
    .replace("<!--data-->", () => `<script type="application/json" id="data">${safeJson(data)}</script>`);
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(html);
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`http://localhost:${port}`));
