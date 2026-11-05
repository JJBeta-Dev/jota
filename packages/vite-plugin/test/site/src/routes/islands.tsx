import { Island, type JSXElement } from "jota-js";
import Counter from "../islands/Counter";

export const head = { title: "Islands" };

// A static page with one interactive island: only this page loads JavaScript.
export default function IslandsPage(): JSXElement {
  return (
    <main>
      <h1>Islands</h1>
      <p>Static text around the island.</p>
      <Island name="Counter" component={Counter} props={{ start: 5 }} load="load" />
    </main>
  );
}
