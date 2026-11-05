import { createRoutes, startIslands, startRouter } from "jota-js";
import "./style.css";

// Pages with islands mount just those; every other page is handled by the client router.
if (!startIslands(import.meta.glob("/src/islands/*.tsx"))) {
  const routes = createRoutes(import.meta.glob("/src/routes/**/*.tsx"));
  startRouter(routes, document.getElementById("app") as HTMLElement);
}
