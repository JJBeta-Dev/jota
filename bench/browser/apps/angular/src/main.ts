import { ApplicationRef, ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal, type WritableSignal } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { randomLabel } from "../../shared";

/**
 * js-framework-benchmark style table, written the current Angular way: standalone component, signals,
 * zoneless change detection, a tracked @for. `tick()` makes each operation render before the timer stops.
 */
interface Row {
  id: number;
  label: WritableSignal<string>;
}

let nextId = 1;
const buildRows = (count: number): Row[] => Array.from({ length: count }, () => ({ id: nextId++, label: signal(randomLabel()) }));

@Component({
  selector: "app-root",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <table>
      <tbody>
        @for (row of rows(); track row.id) {
          <tr [class]="selected() === row.id ? 'danger' : ''">
            <td class="col-md-1">{{ row.id }}</td>
            <td class="col-md-4">
              <a (click)="selected.set(row.id)">{{ row.label() }}</a>
            </td>
            <td class="col-md-1">
              <button type="button" (click)="remove(row.id)">x</button>
            </td>
            <td class="col-md-6"></td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
class App {
  rows = signal<Row[]>([]);
  selected = signal<number | null>(null);
  remove(id: number): void {
    this.rows.update((rows) => rows.filter((row) => row.id !== id));
  }
}

const application = await bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] });
const tick = () => application.injector.get(ApplicationRef).tick();
const app = application.components[0]?.instance as App;

(window as unknown as { bench: unknown }).bench = {
  run: (count: number) => (app.rows.set(buildRows(count)), tick()),
  add: (count: number) => (app.rows.update((rows) => [...rows, ...buildRows(count)]), tick()),
  updateEveryTenth: () => {
    const rows = app.rows();
    for (let i = 0; i < rows.length; i += 10) (rows[i] as Row).label.update((label) => `${label} !!!`);
    tick();
  },
  select: (index: number) => (app.selected.set(app.rows()[index]?.id ?? null), tick()),
  swap: () => {
    const rows = app.rows();
    if (rows.length >= 999) {
      const copy = [...rows];
      [copy[1], copy[998]] = [copy[998] as Row, copy[1] as Row];
      app.rows.set(copy);
    }
    tick();
  },
  remove: (index: number) => (app.rows.update((rows) => rows.filter((_, position) => position !== index)), tick()),
  clear: () => (app.rows.set([]), tick()),
  count: () => app.rows().length,
};
