import { signal, type JSXElement } from "jota-js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "invalid" | "done";

/** Interactive island: validates the address and confirms. The page around it is static HTML. */
export default function Newsletter(): JSXElement {
  const [email, setEmail] = signal("");
  const [status, setStatus] = signal<Status>("idle");

  const submit = (event: Event) => {
    event.preventDefault();
    setStatus(EMAIL.test(email().trim()) ? "done" : "invalid");
  };

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="newsletter-email">Email address</label>{" "}
      <input
        id="newsletter-email"
        type="email"
        autocomplete="email"
        value={email()}
        onInput={(event: Event) => setEmail((event.currentTarget as HTMLInputElement).value)}
      />{" "}
      <button type="submit">Subscribe</button>
      <p role="status" class={status() === "invalid" ? "error" : "ok"}>
        {status() === "invalid" ? "Please enter a valid email address." : status() === "done" ? "Thanks, you are on the list." : ""}
      </p>
    </form>
  );
}
