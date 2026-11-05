import { For, Show, computed, mergeProps, signal, type JSXElement, type ParentProps } from "jota-js";

export const controls = {
  setOn: (_value: boolean) => {},
  setItems: (_value: string[]) => {},
  setColor: (_value: string) => {},
  setBig: (_value: boolean) => {},
  setName: (_value: string) => {},
  refEl: undefined as HTMLElement | undefined,
};

function Card(props: ParentProps & { title: string }): JSXElement {
  return (
    <article>
      <h3>{props.title}</h3>
      {props.children}
    </article>
  );
}

function Tag(props: { text: string; strong?: boolean }): JSXElement {
  const merged = mergeProps({ strong: false }, props);
  return <span class={merged.strong ? "strong" : "plain"}>{props.text}</span>;
}

export function Features(): JSXElement {
  const [on, setOn] = signal(false);
  const [items, setItems] = signal(["a", "b", "c"]);
  const [color, setColor] = signal("red");
  const [big, setBig] = signal(false);
  const [name, setName] = signal("Ada");
  const upper = computed(() => name().toUpperCase());
  controls.setOn = setOn;
  controls.setItems = setItems;
  controls.setColor = setColor;
  controls.setBig = setBig;
  controls.setName = setName;

  return (
    <div
      id="root"
      class="base"
      classList={{ active: on() }}
      style={{ color: color() }}
      data-name={name()}
      ref={(el: HTMLElement) => {
        controls.refEl = el;
      }}
    >
      <Show when={on()} fallback={<p id="off">off</p>}>
        <p id="on">on</p>
      </Show>
      <ul>
        <For each={items()}>{(item, index) => <li data-item={item}>{index()}:{item}</li>}</For>
      </ul>
      <output>{big() ? <b>BIG</b> : "small"}</output>
      <Card title={upper()}>
        <Tag text="child" strong={big()} />
      </Card>
    </div>
  );
}
