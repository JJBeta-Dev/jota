import type { JSXElement, ParentProps } from "jota-js";

export function Shell(props: ParentProps): JSXElement {
  return (
    <>
      <header>
        <nav aria-label="Main">
          <a href="/">Blog</a>
          <a href="/about">About</a>
        </nav>
      </header>
      <main>{props.children}</main>
      <footer>
        <p class="muted">Built with Jota. No JavaScript on any page.</p>
      </footer>
    </>
  );
}
