import { render } from "jota-js";
import { App } from "./App";
import "./style.css";

render(() => <App />, document.getElementById("app") as HTMLElement);
