import { For, render, signal } from "jota-js";

// js-framework-benchmark style table. Keep this file and ../../solid/src/main.tsx equivalent.
interface Row {
  id: number;
  label: () => string;
  setLabel: (update: (previous: string) => string) => void;
}

const ADJECTIVES = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint"];
const COLOURS = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "orange", "white", "black"];
const NOUNS = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger"];
const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)] as string;

let nextId = 1;
function buildRows(count: number): Row[] {
  return Array.from({ length: count }, () => {
    const [label, setLabel] = signal(`${pick(ADJECTIVES)} ${pick(COLOURS)} ${pick(NOUNS)}`);
    return { id: nextId++, label, setLabel: (update) => void setLabel(update) };
  });
}

const [rows, setRows] = signal<Row[]>([]);
const [selected, setSelected] = signal<number | null>(null);

const bench = {
  run: (count: number) => void setRows(buildRows(count)),
  add: (count: number) => void setRows((current) => [...current, ...buildRows(count)]),
  updateEveryTenth: () => rows().forEach((row, index) => index % 10 === 0 && row.setLabel((label) => `${label} !!!`)),
  select: (index: number) => void setSelected(rows()[index]?.id ?? null),
  swap: () =>
    void setRows((current) => {
      if (current.length < 999) return current;
      const copy = [...current];
      [copy[1], copy[998]] = [copy[998] as Row, copy[1] as Row];
      return copy;
    }),
  remove: (index: number) => void setRows((current) => current.filter((_, position) => position !== index)),
  clear: () => void setRows([]),
  count: () => rows().length,
};

(window as unknown as { bench: typeof bench }).bench = bench;

function App() {
  return (
    <table>
      <tbody>
        <For each={rows()}>
          {(row) => (
            <tr class={selected() === row.id ? "danger" : ""}>
              <td class="col-md-1">{row.id}</td>
              <td class="col-md-4">
                <a onClick={() => setSelected(row.id)}>{row.label()}</a>
              </td>
              <td class="col-md-1">
                <button type="button" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}>
                  x
                </button>
              </td>
              <td class="col-md-6" />
            </tr>
          )}
        </For>
      </tbody>
    </table>
  );
}

render(() => <App />, document.getElementById("app") as HTMLElement);
