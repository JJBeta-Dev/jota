import { createRoutes, startRouter } from "jota-js";
import "./style.css";

const routes = createRoutes(import.meta.glob("/src/routes/**/*.tsx"));
startRouter(routes, document.getElementById("app") as HTMLElement);
