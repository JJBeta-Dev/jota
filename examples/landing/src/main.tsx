import { startIslands } from "jota-js";
import "./style.css";

/** Mount the islands of the current page. Everything else on the page is plain HTML. */
startIslands(import.meta.glob("/src/islands/*.tsx"));
