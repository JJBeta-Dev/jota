import { For, batch, computed, render, signal } from "jota-js";

const ADJECTIVES = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
const COLOURS = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
const NOUNS = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];
const random = (max) => Math.round(Math.random() * 1000) % max;

let nextId = 1;
function buildData(count) {
  const data = new Array(count);
  for (let i = 0; i < count; i++) {
    const [label, setLabel] = signal(`${ADJECTIVES[random(ADJECTIVES.length)]} ${COLOURS[random(COLOURS.length)]} ${NOUNS[random(NOUNS.length)]}`);
    data[i] = { id: nextId++, label, setLabel };
  }
  return data;
}

function Button(props) {
  return (
    <div class="col-sm-6 smallpad">
      <button id={props.id} class="btn btn-primary btn-block" type="button" onClick={props.onClick}>
        {props.text}
      </button>
    </div>
  );
}

function App() {
  const [data, setData] = signal([]);
  const [selected, setSelected] = signal(null);

  const run = () => setData(buildData(1000));
  const runLots = () => setData(buildData(10000));
  const add = () => setData((current) => [...current, ...buildData(1000)]);
  const update = () =>
    batch(() => {
      const rows = data();
      for (let i = 0; i < rows.length; i += 10) rows[i].setLabel((label) => `${label} !!!`);
    });
  const clear = () => setData([]);
  const swapRows = () => {
    const rows = data().slice();
    if (rows.length > 998) {
      const row = rows[1];
      rows[1] = rows[998];
      rows[998] = row;
      setData(rows);
    }
  };
  const remove = (id) => setData((current) => current.filter((row) => row.id !== id));

  return (
    <div class="container">
      <div class="jumbotron">
        <div class="row">
          <div class="col-md-6">
            <h1>Jota</h1>
          </div>
          <div class="col-md-6">
            <div class="row">
              <Button id="run" text="Create 1,000 rows" onClick={run} />
              <Button id="runlots" text="Create 10,000 rows" onClick={runLots} />
              <Button id="add" text="Append 1,000 rows" onClick={add} />
              <Button id="update" text="Update every 10th row" onClick={update} />
              <Button id="clear" text="Clear" onClick={clear} />
              <Button id="swaprows" text="Swap Rows" onClick={swapRows} />
            </div>
          </div>
        </div>
      </div>
      <table class="table table-hover table-striped test-data">
        <tbody>
          <For each={data()}>
            {(row) => {
              const isSelected = computed(() => selected() === row.id);
              return (
                <tr class={isSelected() ? "danger" : ""}>
                  <td class="col-md-1">{row.id}</td>
                  <td class="col-md-4">
                    <a onClick={() => setSelected(row.id)}>{row.label()}</a>
                  </td>
                  <td class="col-md-1">
                    <a onClick={() => remove(row.id)}>
                      <span class="glyphicon glyphicon-remove" aria-hidden="true" />
                    </a>
                  </td>
                  <td class="col-md-6" />
                </tr>
              );
            }}
          </For>
        </tbody>
      </table>
      <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
    </div>
  );
}

render(() => <App />, document.getElementById("main"));
