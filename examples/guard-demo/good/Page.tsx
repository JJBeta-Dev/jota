// Fixed version of bad/Page.tsx: Jota Guard reports nothing here.
export function Page({ openMenu }: { openMenu: () => void }) {
  return (
    <html lang="en">
      <body>
        <h1>Welcome</h1>
        <h2>Section title</h2>
        <button type="button" onClick={openMenu}>
          Open menu
        </button>
        <img src="/photo.jpg" alt="Team working at the studio" width={800} height={600} />
        <button type="button" aria-label="Close dialog">
          <svg aria-hidden="true" />
        </button>
        <a href="/docs">Read the Guard docs</a>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" name="email" />
        <div role="region" aria-label="Notes" tabIndex={0}>
          Natural focus order
        </div>
        <video src="/intro.mp4" controls>
          <track kind="captions" src="/intro.vtt" srcLang="en" label="English" />
        </video>
      </body>
    </html>
  );
}
