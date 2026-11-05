import { render } from "jota-js";
import { App } from "./App.js";
import "./style.css";

render(() => <App />, document.getElementById("app") as HTMLElement);
