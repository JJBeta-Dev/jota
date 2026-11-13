import type { JSXElement, ParentProps } from "jota-js";

export type Lang = "en" | "es";

interface LayoutProps extends ParentProps {
  lang: Lang;
  /** Path of the current page, used to mark the active link and build the language switch. */
  path: string;
}

const NAV = {
  en: [
    { href: "/", label: "Home" },
    { href: "/docs/getting-started", label: "Getting started" },
    { href: "/docs/signals", label: "Signals" },
    { href: "/docs/routing", label: "Routing and static pages" },
    { href: "/docs/islands", label: "Islands and build options" },
    { href: "/docs/guard", label: "Guard" },
    { href: "/docs/markdown", label: "Markdown" },
    { href: "/docs/toolkit", label: "Data, forms and widgets" },
    { href: "/playground", label: "Playground" },
  ],
  es: [
    { href: "/es", label: "Inicio" },
    { href: "/es/docs/getting-started", label: "Primeros pasos" },
    { href: "/es/docs/senales", label: "Signals" },
    { href: "/es/docs/rutas", label: "Rutas y páginas estáticas" },
    { href: "/es/docs/islas", label: "Islas y opciones del build" },
    { href: "/es/docs/guard", label: "Guard" },
    { href: "/es/docs/markdown", label: "Markdown" },
    { href: "/es/docs/herramientas", label: "Datos, formularios y componentes" },
  ],
} as const;

const PAIRS: Array<[en: string, es: string]> = [
  ["/", "/es"],
  ["/docs/getting-started", "/es/docs/getting-started"],
  ["/docs/signals", "/es/docs/senales"],
  ["/docs/routing", "/es/docs/rutas"],
  ["/docs/islands", "/es/docs/islas"],
  ["/docs/guard", "/es/docs/guard"],
  ["/docs/markdown", "/es/docs/markdown"],
  ["/docs/toolkit", "/es/docs/herramientas"],
];
const TRANSLATED = new Map<string, string>(PAIRS.flatMap(([en, es]) => [[en, es], [es, en]] as Array<[string, string]>));

export function Layout(props: LayoutProps): JSXElement {
  const es = props.lang === "es";
  const other = TRANSLATED.get(props.path) ?? (es ? "/" : "/es");

  return (
    <>
      <a class="skip" href="#content">
        {es ? "Saltar al contenido" : "Skip to content"}
      </a>
      <header class="site-header">
        <a href={es ? "/es" : "/"} aria-label="Jota">
          <img src="/logo.svg" alt="Jota" width={140} height={70} />
        </a>
        <nav aria-label={es ? "Principal" : "Main"}>
          {NAV[props.lang].map((item) => (
            <a href={item.href} aria-current={item.href === props.path ? "page" : undefined}>
              {item.label}
            </a>
          ))}
          <a href="https://github.com/JJBeta-Dev/jota">GitHub</a>
          <a href={other} lang={es ? "en" : "es"}>
            {es ? "English" : "Español"}
          </a>
        </nav>
      </header>
      <main id="content">{props.children}</main>
      <footer class="site-footer">
        <p>
          {es
            ? "Jota es de código abierto (MIT) y está en etapa pre-alpha. Hecho por JJBeta."
            : "Jota is open source (MIT) and pre-alpha. Made by JJBeta."}
        </p>
      </footer>
    </>
  );
}

/** A block of code. The text is passed as a string so braces and angle brackets need no escaping. */
export function Code(props: { code: string }): JSXElement {
  return (
    <pre>
      <code>{props.code}</code>
    </pre>
  );
}
