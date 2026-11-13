import type { JSXElement } from "jota-js";
import { Shell } from "../../components/Shell";
import { posts, type Post } from "../../data/posts";

export const paths = () => posts.map((post) => ({ slug: post.slug }));

export const load = ({ params }: { params: Record<string, string> }): Post => {
  const post = posts.find((candidate) => candidate.slug === params.slug);
  if (!post) throw new Error(`Unknown post: ${params.slug}`);
  return post;
};

export const head = (_params: Record<string, string>, data?: unknown) => {
  const post = data as Post;
  return { title: `${post.title} | Jota blog`, description: post.summary, lang: "en" };
};

export default function PostPage(props: { params: Record<string, string>; data?: unknown }): JSXElement {
  const post = props.data as Post;
  return (
    <Shell>
      <article>
        <h1>{post.title}</h1>
        <p class="muted">
          <time datetime={post.date}>{post.date}</time>
        </p>
        {post.html ? <div innerHTML={post.html} /> : post.body.map((paragraph) => <p>{paragraph}</p>)}
        <p>
          <a href="/">Back to all posts</a>
        </p>
      </article>
    </Shell>
  );
}
