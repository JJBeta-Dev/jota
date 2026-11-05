import type { JSXElement } from "jota-js";

// Dynamic route without `paths`: it must be skipped with a warning, not crash the build.
export default function User(props: { params: Record<string, string> }): JSXElement {
  return <p>User {props.params.id}</p>;
}
