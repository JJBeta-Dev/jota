import { For, Show, computed, signal, type JSXElement } from "jota-js";
import { MONTHS, PRODUCTS, seriesFor, type Product } from "./data";

export function App(): JSXElement {
  const [product, setProduct] = signal<Product>("all");
  const [fromMonth, setFromMonth] = signal(0);

  const rows = computed(() =>
    seriesFor(product())
      .map((units, index) => ({ month: MONTHS[index] as string, units, index }))
      .filter((row) => row.index >= fromMonth()),
  );
  const total = computed(() => rows().reduce((sum, row) => sum + row.units, 0));
  const average = computed(() => (rows().length ? Math.round(total() / rows().length) : 0));
  const best = computed(() => rows().reduce<{ month: string; units: number } | null>((top, row) => (!top || row.units > top.units ? row : top), null));
  const max = computed(() => Math.max(1, ...rows().map((row) => row.units)));

  return (
    <>
      <header>
        <nav aria-label="Main">
          <a href="/">Sales dashboard</a>
        </nav>
      </header>
      <main>
        <h1>
          Sales <em>overview</em>
        </h1>

        <form class="card" onSubmit={(event: Event) => event.preventDefault()}>
          <label htmlFor="product">Product</label>{" "}
          <select id="product" onChange={(event: Event) => setProduct((event.currentTarget as HTMLSelectElement).value as Product)}>
            <For each={PRODUCTS}>{(item) => <option value={item.id}>{item.label}</option>}</For>
          </select>{" "}
          <label htmlFor="from">From</label>{" "}
          <select id="from" onChange={(event: Event) => setFromMonth(Number((event.currentTarget as HTMLSelectElement).value))}>
            <For each={[...MONTHS]}>{(month, index) => <option value={index()}>{month}</option>}</For>
          </select>
        </form>

        <section class="card" aria-labelledby="summary-title">
          <h2 id="summary-title">Summary</h2>
          <p id="total">Total: {total()} units</p>
          <p id="average">Average per month: {average()} units</p>
          <p id="best">
            <Show when={best()} fallback="No data">
              {(top) => `Best month: ${top.month} (${top.units} units)`}
            </Show>
          </p>
        </section>

        <section class="card" aria-labelledby="chart-title">
          <h2 id="chart-title">Units per month</h2>
          <svg viewBox="0 0 300 120" role="img" aria-label="Bar chart of units sold per month" width="100%">
            <For each={rows()}>
              {(row) => (
                <rect
                  class="bar"
                  data-month={row.month}
                  x={row.index * 48 + 8}
                  y={110 - (row.units / max()) * 100}
                  width="36"
                  height={(row.units / max()) * 100}
                  fill="#6f3af8"
                />
              )}
            </For>
          </svg>
          <table>
            <caption class="muted">Data</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Units</th>
              </tr>
            </thead>
            <tbody>
              <For each={rows()}>
                {(row) => (
                  <tr>
                    <td>{row.month}</td>
                    <td>{row.units}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}
