/**
 * Type-level checks for the JSX element types. This file is only typechecked (`pnpm typecheck`).
 * Every `@ts-expect-error` must really be an error, otherwise TypeScript reports the line.
 */
import type { JSXElement } from "jota-js";

export function Valid(): JSXElement {
  let button: HTMLButtonElement | undefined;
  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate>
      <label for="email">Email</label>
      <label htmlFor="email">Email (React-style alias)</label>
      <input
        id="email"
        type="email"
        value="a@b.c"
        required
        aria-label="Email"
        data-test="1"
        onInput={(event) => event.currentTarget.value.toUpperCase()}
      />
      <button ref={button} type="submit" disabled={false} onClick={(event) => event.currentTarget.blur()}>
        Send
      </button>
      <a href="/docs" target="_blank" rel="noopener" aria-current={undefined}>
        Docs
      </a>
      <img src="/a.jpg" alt="" width={10} height="5" loading="lazy" fetchpriority="high" />
      <select value="a" onChange={(event) => event.currentTarget.value}>
        <option value="a" selected>
          A
        </option>
      </select>
      <table>
        <tbody>
          <tr>
            <td colSpan={2}>cell</td>
          </tr>
        </tbody>
      </table>
      <div class="x" classList={{ on: true, off: false }} style={{ color: "red", "--gap": 4 }} tabIndex={0} ref={(el) => el.focus()}>
        <svg viewBox="0 0 10 10" width={10} height="10">
          <rect x={1} y="2" width={3} height={3} fill="red" stroke-width={2} />
        </svg>
        <my-widget anything="goes" count={3} />
      </div>
    </form>
  );
}

export function Invalid(): JSXElement {
  return (
    <div>
      {/** @ts-expect-error an unknown button type */}
      <button type="nope">x</button>
      {/** @ts-expect-error href must be a string */}
      <a href={5}>x</a>
      {/** @ts-expect-error unknown element */}
      <blink />
      {/** @ts-expect-error the handler gets an InputEvent, not a KeyboardEvent */}
      <input onInput={(event: KeyboardEvent) => event} />
      {/** @ts-expect-error unknown attribute on a known element */}
      <img src="/a.jpg" alt="" sizzle="yes" />
      {/** @ts-expect-error loading must be eager or lazy */}
      <img src="/a.jpg" alt="" loading="sometimes" />
      {/** @ts-expect-error tabIndex is a number */}
      <div tabIndex="0" />
    </div>
  );
}
