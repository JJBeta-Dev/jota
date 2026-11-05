// Planted violations for Jota Guard. Do not fix: tests expect these problems.
export function Page({ openMenu }: { openMenu: () => void }) {
  return (
    <html>
      <body>
        <h1>Welcome</h1>
        <h3>Skipped a level</h3>
        <div onClick={openMenu}>Open menu</div>
        <img src="/photo.jpg" />
        <button>
          <svg aria-hidden="true" />
        </button>
        <a href="#">Read more</a>
        <input type="email" name="email" />
        <div tabIndex={3}>Odd focus order</div>
        <video src="/intro.mp4" controls />
      </body>
    </html>
  );
}
