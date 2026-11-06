import { onCleanup, signal, type JSXElement } from "jota-js";
import { Layout } from "../components/Layout";
import { EXAMPLE } from "../playground/example";

// The only page of this site that loads JavaScript: it compiles your code in the browser.
export const config = { render: "client" } as const;

export const head = {
  title: "Playground | Jota",
  description: "Write Jota TSX and run it in your browser. The code is compiled locally; nothing is sent anywhere.",
  lang: "en",
};

export default function Playground(): JSXElement {
  const [code, setCode] = signal(EXAMPLE);
  const [status, setStatus] = signal("");
  const [failed, setFailed] = signal(false);
  const [preview, setPreview] = signal("");

  const onMessage = (event: MessageEvent) => {
    const data = event.data as { type?: string; message?: string } | null;
    if (data?.type === "jota-playground-error") {
      setFailed(true);
      setStatus(`Runtime error: ${data.message ?? "unknown"}`);
    } else if (data?.type === "jota-playground-ready" && !failed()) {
      setStatus("Running.");
    }
  };
  window.addEventListener("message", onMessage);
  onCleanup(() => window.removeEventListener("message", onMessage));

  const run = async () => {
    setFailed(false);
    setStatus("Compiling...");
    const { compileSnippet, previewDocument } = await import("../playground/compile");
    const result = await compileSnippet(code());
    if (result.error !== undefined || result.code === undefined) {
      setFailed(true);
      setStatus(`Compile error: ${result.error ?? "unknown"}`);
      return;
    }
    setPreview(previewDocument(result.code, window.location.origin));
  };

  return (
    <Layout lang="en" path="/playground">
      <h1>Playground</h1>
      <p class="lead">
        Write TSX and run it. The code is compiled in your browser with the same compiler as the Vite plugin; nothing is sent
        anywhere.
      </p>

      <label htmlFor="playground-code">Code</label>
      <textarea
        id="playground-code"
        class="playground-code"
        rows={18}
        spellcheck={false}
        value={code()}
        onInput={(event) => setCode(event.currentTarget.value)}
      />
      <div class="actions">
        <button type="button" class="button" onClick={run}>
          Run
        </button>
      </div>
      <p id="playground-status" role={failed() ? "alert" : "status"} class={failed() ? "error" : "muted"}>
        {status()}
      </p>

      <h2>Preview</h2>
      <iframe title="Preview" class="playground-preview" srcdoc={preview()} />
      <p class="muted">
        The preview runs the code you type inside a frame of this page. Do not paste code you do not trust.
      </p>
    </Layout>
  );
}
