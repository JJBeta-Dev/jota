import { hydrate, render } from "jota-js";
import { Page, type PageData } from "./Page.js";

const app = document.getElementById("app") as HTMLElement;
const data = JSON.parse(document.getElementById("data")?.textContent ?? "{}") as PageData;

if (!hydrate(() => <Page data={data} />, app)) {
  app.textContent = "";
  render(() => <Page data={data} />, app);
}
