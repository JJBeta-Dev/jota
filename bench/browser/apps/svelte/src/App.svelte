<script lang="ts">
  import { flushSync } from "svelte";
  import { randomLabel } from "../../shared";

  /**
   * js-framework-benchmark style table, written the usual Svelte 5 way: a raw list, a reactive label
   * per row, a keyed each block. `flushSync` makes each operation render before the timer stops.
   */
  class Row {
    id: number;
    label = $state("");
    constructor(id: number, label: string) {
      this.id = id;
      this.label = label;
    }
  }

  let nextId = 1;
  const buildRows = (count: number): Row[] => Array.from({ length: count }, () => new Row(nextId++, randomLabel()));

  let rows = $state.raw<Row[]>([]);
  let selected = $state<number | null>(null);
  const remove = (id: number) => (rows = rows.filter((row) => row.id !== id));

  (window as unknown as { bench: unknown }).bench = {
    run: (count: number) => flushSync(() => (rows = buildRows(count))),
    add: (count: number) => flushSync(() => (rows = [...rows, ...buildRows(count)])),
    updateEveryTenth: () =>
      flushSync(() => {
        for (let i = 0; i < rows.length; i += 10) (rows[i] as Row).label += " !!!";
      }),
    select: (index: number) => flushSync(() => (selected = rows[index]?.id ?? null)),
    swap: () =>
      flushSync(() => {
        if (rows.length < 999) return;
        const copy = [...rows];
        [copy[1], copy[998]] = [copy[998] as Row, copy[1] as Row];
        rows = copy;
      }),
    remove: (index: number) => flushSync(() => (rows = rows.filter((_, position) => position !== index))),
    clear: () => flushSync(() => (rows = [])),
    count: () => rows.length,
  };
</script>

<table>
  <tbody>
    {#each rows as row (row.id)}
      <tr class={selected === row.id ? "danger" : ""}>
        <td class="col-md-1">{row.id}</td>
        <td class="col-md-4">
          <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions, a11y_missing_attribute -->
          <a onclick={() => (selected = row.id)}>{row.label}</a>
        </td>
        <td class="col-md-1">
          <button type="button" onclick={() => remove(row.id)}>x</button>
        </td>
        <td class="col-md-6"></td>
      </tr>
    {/each}
  </tbody>
</table>
