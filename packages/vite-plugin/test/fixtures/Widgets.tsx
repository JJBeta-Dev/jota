import { createDialog, createDisclosure, createTabs } from "../../../core/src/ui.js";

export function Widgets() {
  const more = createDisclosure({ id: "more" });
  const tabs = createTabs({ tabs: ["one", "two", "three"] as const, id: "t" });
  const dialog = createDialog({ id: "d" });
  return (
    <main>
      <button {...more.trigger}>More</button>
      <div {...more.panel}>Details</div>

      <div {...tabs.list} aria-label="Sections">
        <button {...tabs.tab("one")}>One</button>
        <button {...tabs.tab("two")}>Two</button>
        <button {...tabs.tab("three")}>Three</button>
      </div>
      <div {...tabs.panel("one")}>First</div>
      <div {...tabs.panel("two")}>Second</div>
      <div {...tabs.panel("three")}>Third</div>

      <button type="button" id="open" onClick={dialog.show}>
        Open
      </button>
      <dialog {...dialog.dialog}>
        <h2 {...dialog.title}>Confirm</h2>
        <button type="button" id="close" onClick={dialog.close}>
          Close
        </button>
      </dialog>
    </main>
  );
}
