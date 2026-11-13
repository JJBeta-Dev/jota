/**
 * Every page of this site is static HTML with no JavaScript, except the playground, which compiles
 * your code in the browser. The static build removes this script from every other page.
 */
import { createRoutes, startRouter } from "jota-js";
import "./style.css";

const routes = createRoutes(import.meta.glob("/src/routes/playground.tsx"));
startRouter(routes, document.getElementById("app") as HTMLElement);
