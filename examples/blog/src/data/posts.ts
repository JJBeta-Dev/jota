export interface Post {
  slug: string;
  title: string;
  date: string;
  summary: string;
  body: string[];
  /** Set for posts written in Markdown (src/content). */
  html?: string;
}

const written: Post[] = [
  {
    slug: "components-run-once",
    title: "Components run once",
    date: "2026-11-01",
    summary: "Why a click changes one text node and nothing else.",
    body: [
      "In Jota a component is a plain function that is called one time. There is no render loop to optimize.",
      "The compiler turns each expression in your JSX into a tiny effect bound to the node that uses it. When a signal changes, only those effects run.",
    ],
  },
  {
    slug: "pages-without-javascript",
    title: "Pages without JavaScript",
    date: "2026-11-03",
    summary: "Static routes ship HTML only; interactivity is opt-in.",
    body: [
      "Every file in the routes folder becomes a page at build time. By default the page contains no script tag.",
      "When a page needs interactivity you mark a route as client, or place an island inside the static page.",
    ],
  },
  {
    slug: "guardrails-in-the-build",
    title: "Guardrails in the build",
    date: "2026-11-05",
    summary: "Accessibility checks that fail the build instead of a report nobody reads.",
    body: [
      "Jota Guard checks images, buttons, links, labels and headings. The same rules run in your editor through ESLint and in the command line.",
      "Severity is yours to choose: warnings by default, errors when you are ready.",
    ],
  },
];

/** Stand-in for a real data source: the static build awaits it before rendering the pages. */
export async function loadPosts(): Promise<Post[]> {
  await Promise.resolve();
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

interface MarkdownFile {
  html: string;
  frontmatter: Record<string, unknown>;
}

const files = import.meta.glob<MarkdownFile>("../content/*.md", { eager: true });

const fromMarkdown: Post[] = Object.entries(files).map(([path, file]) => ({
  slug: path.slice(path.lastIndexOf("/") + 1, -".md".length),
  title: String(file.frontmatter.title),
  date: String(file.frontmatter.date),
  summary: String(file.frontmatter.summary),
  body: [],
  html: file.html,
}));

export const posts: Post[] = [...written, ...fromMarkdown];
