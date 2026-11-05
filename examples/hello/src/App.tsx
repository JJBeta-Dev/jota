import { For, Show, computed, signal, type JSXElement } from "jota-js";

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export function App(): JSXElement {
  const [todos, setTodos] = signal<Todo[]>([]);
  const [text, setText] = signal("");
  const remaining = computed(() => todos().filter((todo) => !todo.done).length);
  let nextId = 1;

  const add = (event: Event) => {
    event.preventDefault();
    const value = text().trim();
    if (!value) return;
    setTodos([...todos(), { id: nextId++, text: value, done: false }]);
    setText("");
  };

  const toggle = (id: number) => {
    setTodos(todos().map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  };

  return (
    <main>
      <h1>Hello Jota</h1>
      <form onSubmit={add}>
        <label htmlFor="new-todo">New task</label>
        <input
          id="new-todo"
          value={text()}
          onInput={(event: Event) => setText((event.currentTarget as HTMLInputElement).value)}
        />
        <button type="submit">Add</button>
      </form>

      <Show when={todos().length > 0} fallback={<p id="empty">No tasks yet.</p>}>
        <ul>
          <For each={todos()}>
            {(todo) => (
              <li class={todo.done ? "done" : ""}>
                <label>
                  <input type="checkbox" checked={todo.done} onChange={() => toggle(todo.id)} />
                  {todo.text}
                </label>
              </li>
            )}
          </For>
        </ul>
      </Show>

      <p id="remaining">{remaining()} left</p>
    </main>
  );
}
