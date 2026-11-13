<script setup lang="ts">
import { nextTick, shallowRef, type ShallowRef } from "vue";
import { randomLabel } from "../../shared";

/**
 * js-framework-benchmark style table, written the usual Vue way: a shallow list, a ref per label,
 * a keyed v-for. Each operation waits for `nextTick`, when Vue has updated the DOM.
 */
interface Row {
  id: number;
  label: ShallowRef<string>;
}

let nextId = 1;
const buildRows = (count: number): Row[] => Array.from({ length: count }, () => ({ id: nextId++, label: shallowRef(randomLabel()) }));

const rows = shallowRef<Row[]>([]);
const selected = shallowRef<number | null>(null);
const remove = (id: number) => (rows.value = rows.value.filter((row) => row.id !== id));

(window as unknown as { bench: unknown }).bench = {
  run: (count: number) => ((rows.value = buildRows(count)), nextTick()),
  add: (count: number) => ((rows.value = [...rows.value, ...buildRows(count)]), nextTick()),
  updateEveryTenth: () => {
    const list = rows.value;
    for (let i = 0; i < list.length; i += 10) (list[i] as Row).label.value += " !!!";
    return nextTick();
  },
  select: (index: number) => ((selected.value = rows.value[index]?.id ?? null), nextTick()),
  swap: () => {
    const list = rows.value;
    if (list.length >= 999) {
      const copy = [...list];
      [copy[1], copy[998]] = [copy[998] as Row, copy[1] as Row];
      rows.value = copy;
    }
    return nextTick();
  },
  remove: (index: number) => ((rows.value = rows.value.filter((_, position) => position !== index)), nextTick()),
  clear: () => ((rows.value = []), nextTick()),
  count: () => rows.value.length,
};
</script>

<template>
  <table>
    <tbody>
      <tr v-for="row of rows" :key="row.id" :class="selected === row.id ? 'danger' : ''">
        <td class="col-md-1">{{ row.id }}</td>
        <td class="col-md-4">
          <a @click="selected = row.id">{{ row.label.value }}</a>
        </td>
        <td class="col-md-1">
          <button type="button" @click="remove(row.id)">x</button>
        </td>
        <td class="col-md-6"></td>
      </tr>
    </tbody>
  </table>
</template>
