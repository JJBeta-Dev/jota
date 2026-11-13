import type { JSXElement } from "jota-js";
import { defineCollection } from "jota-js/content";
import { Layout } from "../../components/Layout";

const pages = defineCollection(import.meta.glob("../../content/en/*.md", { eager: true }), {
  title: "string",
  description: "string",
  order: "number",
});
const find = (slug: string | undefined) => {
  const page = pages.find((candidate) => candidate.slug === slug);
  if (!page) throw new Error(`Unknown docs page: ${slug ?? ""}`);
  return page;
};

export const paths = () => pages.map((page) => ({ slug: page.slug }));

export const head = (params: Record<string, string>) => {
  const page = find(params.slug);
  return { title: `${page.data.title} | Jota`, description: page.data.description, lang: "en" };
};

export default function DocsPage(props: { params: Record<string, string> }): JSXElement {
  const page = find(props.params.slug);
  return (
    <Layout lang="en" path={`/docs/${page.slug}`}>
      <div innerHTML={page.html} />
    </Layout>
  );
}
