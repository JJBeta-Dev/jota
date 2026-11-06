import { For, signal, type JSXElement } from "jota-js";

export interface PageData {
  title: string;
  renderedAt: string;
  posts: string[];
}

export function Page(props: { data: PageData }): JSXElement {
  const [likes, setLikes] = signal(0);

  return (
    <main>
      <h1>{props.data.title}</h1>
      <p>Rendered on the server at {props.data.renderedAt}.</p>
      <ul>
        <For each={props.data.posts}>{(post) => <li>{post}</li>}</For>
      </ul>
      <button type="button" onClick={() => setLikes(likes() + 1)}>
        Likes: {likes()}
      </button>
    </main>
  );
}
