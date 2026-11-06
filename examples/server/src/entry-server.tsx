import { renderToString } from "jota-js/server";
import { Page, type PageData } from "./Page.js";

/** Render the page for one request. The data is loaded before, so rendering stays synchronous. */
export function render(data: PageData): Promise<string> {
  return renderToString(() => <Page data={data} />);
}
