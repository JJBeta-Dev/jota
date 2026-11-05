import type { JSXElement } from "jota-js";
import { Shell } from "../components/Shell";
import { loadPosts, type Post } from "../data/posts";

export const load = loadPosts;

export const head = {
  title: "Blog | Jota",
  description: "A static blog built with Jota.",
  lang: "en",
};

export default function Home(props: { params: Record<string, string>; data?: unknown }): JSXElement {
  const posts = props.data as Post[];
  return (
    <Shell>
      <h1>
        The <em>Jota</em> blog
      </h1>
      <p class="muted">Short notes on how Jota works.</p>
      {posts.map((post) => (
        <article class="card">
          <h2>
            <a href={`/blog/${post.slug}`}>{post.title}</a>
          </h2>
          <p class="muted">
            <time datetime={post.date}>{post.date}</time>
          </p>
          <p>{post.summary}</p>
        </article>
      ))}
    </Shell>
  );
}
