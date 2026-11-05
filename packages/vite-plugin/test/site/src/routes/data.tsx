import type { JSXElement } from "jota-js";

interface Data {
  items: string[];
}

// Async data: `load` runs at build time and its result reaches the page and `head` as `data`.
export const load = async (): Promise<Data> => {
  await new Promise((resolve) => setTimeout(resolve, 5));
  return { items: ["alpha", "beta"] };
};

export const head = (_params: Record<string, string>, data?: unknown) => ({
  title: `Data: ${(data as Data).items.length} items`,
});

export default function DataPage(props: { params: Record<string, string>; data?: unknown }): JSXElement {
  const data = props.data as Data;
  return (
    <main>
      <h1>Loaded data</h1>
      <ul>{data.items.map((item) => <li>{item}</li>)}</ul>
    </main>
  );
}
