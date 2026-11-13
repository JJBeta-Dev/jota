import { memo, useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";

/**
 * js-framework-benchmark style table, written the usual React way: immutable rows, keyed list,
 * memoized row component. `flushSync` makes each operation render before the timer stops.
 */
interface Row {
  id: number;
  label: string;
}

const ADJECTIVES = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint"];
const COLOURS = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "orange", "white", "black"];
const NOUNS = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger"];
const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)] as string;

let nextId = 1;
const buildRows = (count: number): Row[] =>
  Array.from({ length: count }, () => ({ id: nextId++, label: `${pick(ADJECTIVES)} ${pick(COLOURS)} ${pick(NOUNS)}` }));

let current: Row[] = [];
let setRows: (update: (rows: Row[]) => Row[]) => void = () => {};
let setSelected: (id: number | null) => void = () => {};

const bench = {
  run: (count: number) => flushSync(() => setRows(() => buildRows(count))),
  add: (count: number) => flushSync(() => setRows((rows) => [...rows, ...buildRows(count)])),
  updateEveryTenth: () =>
    flushSync(() => setRows((rows) => rows.map((row, index) => (index % 10 === 0 ? { ...row, label: `${row.label} !!!` } : row)))),
  select: (index: number) => flushSync(() => setSelected(current[index]?.id ?? null)),
  swap: () =>
    flushSync(() =>
      setRows((rows) => {
        if (rows.length < 999) return rows;
        const copy = [...rows];
        [copy[1], copy[998]] = [copy[998] as Row, copy[1] as Row];
        return copy;
      }),
    ),
  remove: (index: number) => flushSync(() => setRows((rows) => rows.filter((_, position) => position !== index))),
  clear: () => flushSync(() => setRows(() => [])),
  count: () => current.length,
};

(window as unknown as { bench: typeof bench }).bench = bench;

const RowView = memo(function RowView(props: { row: Row; selected: boolean }) {
  return (
    <tr className={props.selected ? "danger" : ""}>
      <td className="col-md-1">{props.row.id}</td>
      <td className="col-md-4">
        <a onClick={() => setSelected(props.row.id)}>{props.row.label}</a>
      </td>
      <td className="col-md-1">
        <button type="button" onClick={() => setRows((rows) => rows.filter((item) => item.id !== props.row.id))}>
          x
        </button>
      </td>
      <td className="col-md-6" />
    </tr>
  );
});

function App() {
  const [rows, updateRows] = useState<Row[]>([]);
  const [selected, updateSelected] = useState<number | null>(null);
  current = rows;
  setRows = updateRows;
  setSelected = updateSelected;
  return (
    <table>
      <tbody>
        {rows.map((row) => (
          <RowView key={row.id} row={row} selected={selected === row.id} />
        ))}
      </tbody>
    </table>
  );
}

flushSync(() => createRoot(document.getElementById("app") as HTMLElement).render(<App />));
