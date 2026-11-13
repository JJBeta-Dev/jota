import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render } from "jota-js";
import { expectAccessible } from "../../core/src/testing.js";
import { Widgets } from "./fixtures/Widgets.js";

let unmount: (() => void) | undefined;
let container: HTMLElement;
const get = <T extends HTMLElement>(selector: string) => container.querySelector(selector) as T;
const key = (name: string) => new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true });

beforeEach(() => {
  container = document.body.appendChild(document.createElement("div"));
  unmount = render(() => <Widgets />, container);
});

afterEach(() => {
  unmount?.();
  document.body.replaceChildren();
});

describe("jota-js/ui in compiled JSX", () => {
  it("disclosure: the button states and controls the panel", () => {
    const button = get<HTMLButtonElement>("button[aria-controls='more']");
    const panel = get("#more");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(panel.hidden).toBe(true);
    button.click();
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hidden).toBe(false);
  });

  it("tabs: one tab stop, panels linked to their tabs", () => {
    const tabs = [...container.querySelectorAll<HTMLButtonElement>("[role=tab]")];
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);
    expect(tabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual(["true", "false", "false"]);
    expect(get("#t-panel-one").hidden).toBe(false);
    expect(get("#t-panel-two").hidden).toBe(true);
    expect(get("#t-panel-two").getAttribute("aria-labelledby")).toBe("t-tab-two");
    tabs[1]?.click();
    expect(get("#t-panel-two").hidden).toBe(false);
    expect(get("#t-panel-one").hidden).toBe(true);
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([-1, 0, -1]);
  });

  it("tabs: arrow keys, Home and End move the selection and the focus", () => {
    const list = get("[role=tablist]");
    const first = get<HTMLButtonElement>("#t-tab-one");
    first.focus();
    first.dispatchEvent(key("ArrowRight"));
    expect(document.activeElement?.id).toBe("t-tab-two");
    list.dispatchEvent(key("End"));
    expect(document.activeElement?.id).toBe("t-tab-three");
    list.dispatchEvent(key("ArrowRight"));
    expect(document.activeElement?.id).toBe("t-tab-one");
    list.dispatchEvent(key("ArrowLeft"));
    expect(get("#t-panel-three").hidden).toBe(false);
    list.dispatchEvent(key("Home"));
    expect(get("#t-tab-one").getAttribute("aria-selected")).toBe("true");
  });

  it("dialog: opens as a modal, is named by its title, and returns focus when it closes", () => {
    const opener = get<HTMLButtonElement>("#open");
    const dialog = get<HTMLDialogElement>("dialog");
    expect(dialog.getAttribute("aria-labelledby")).toBe("d-title");
    expect(get("h2").id).toBe("d-title");
    opener.focus();
    opener.click();
    expect(dialog.open).toBe(true);
    get<HTMLButtonElement>("#close").click();
    dialog.dispatchEvent(new Event("close"));
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it("passes the axe audit in both tab states", async () => {
    await expectAccessible(container);
    get<HTMLButtonElement>("#t-tab-two").click();
    get<HTMLButtonElement>("button[aria-controls='more']").click();
    await expectAccessible(container);
  });
});
