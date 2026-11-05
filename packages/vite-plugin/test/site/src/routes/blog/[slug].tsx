import type { JSXElement } from "jota-js";

export const paths = () => [{ slug: "first-post" }, { slug: "second-post" }];

export const head = (params: Record<string, string>) => ({
  title: `Post: ${params.slug}`,
  description: `Reading ${params.slug}`,
});

export default function Post(props: { params: Record<string, string> }): JSXElement {
  return (
    <article>
      <h1>Post {props.params.slug}</h1>
    </article>
  );
}
