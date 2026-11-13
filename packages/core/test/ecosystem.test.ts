import { describe, expect, it, vi } from "vitest";
import { createRoot, effect, signal } from "../src/index.js";
import { createResource, invalidate } from "../src/resource.js";
import { createStore } from "../src/store.js";
import { createI18n } from "../src/i18n.js";
import { createForm } from "../src/form.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("createResource", () => {
  it("loads, exposes loading and data, and refetches", async () => {
    let calls = 0;
    const resource = createRoot(() => createResource(async () => ++calls));
    expect(resource.loading()).toBe(true);
    expect(resource.data()).toBeUndefined();
    await tick();
    expect(resource.loading()).toBe(false);
    expect(resource.data()).toBe(1);
    await resource.refetch();
    expect(resource.data()).toBe(2);
    resource.mutate(10);
    expect(resource.data()).toBe(10);
  });

  it("reloads when the source changes and skips an empty source", async () => {
    const [id, setId] = signal<number | undefined>(undefined);
    const fetcher = vi.fn(async (value: number) => `user ${value}`);
    const resource = createRoot(() => createResource(id, fetcher));
    await tick();
    expect(fetcher).not.toHaveBeenCalled();
    expect(resource.loading()).toBe(false);
    setId(1);
    await tick();
    expect(resource.data()).toBe("user 1");
    setId(2);
    await tick();
    expect(resource.data()).toBe("user 2");
  });

  it("never lets a slow answer overwrite a newer one, and aborts the old request", async () => {
    const [id, setId] = signal(1);
    const aborted: number[] = [];
    const resource = createRoot(() =>
      createResource(id, (value: number, info) => {
        info.signal.addEventListener("abort", () => aborted.push(value));
        return new Promise<number>((resolve) => setTimeout(() => resolve(value), value === 1 ? 30 : 1));
      }),
    );
    setId(2);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(resource.data()).toBe(2);
    expect(aborted).toEqual([1]);
  });

  it("exposes the error and clears it on the next success", async () => {
    let fail = true;
    const resource = createRoot(() =>
      createResource(async () => {
        if (fail) throw new Error("offline");
        return "ok";
      }),
    );
    await tick();
    expect((resource.error() as Error).message).toBe("offline");
    expect(resource.loading()).toBe(false);
    fail = false;
    await resource.refetch();
    expect(resource.error()).toBeUndefined();
    expect(resource.data()).toBe("ok");
  });

  it("shares cached values by key and reloads on invalidate", async () => {
    let calls = 0;
    const make = () => createRoot(() => createResource(() => 7, async () => ++calls, { cacheKey: (value) => `test/${value}`, staleTime: 60_000 }));
    const first = make();
    await tick();
    const second = make();
    expect(second.data()).toBe(1);
    expect(second.loading()).toBe(false);
    expect(calls).toBe(1);
    invalidate("test/");
    await tick();
    expect(calls).toBe(2);
    expect(first.data()).toBe(2);
    expect(second.data()).toBe(2);
  });
});

describe("createStore", () => {
  it("updates only what reads the changed property", () => {
    const [store, setStore] = createStore({ user: { name: "Ana", age: 30 }, todos: [{ title: "a", done: false }] });
    const runs = { name: 0, age: 0, count: 0, done: 0 };
    createRoot(() => {
      effect(() => void (store.user.name, runs.name++));
      effect(() => void (store.user.age, runs.age++));
      effect(() => void (store.todos.length, runs.count++));
      effect(() => void (store.todos[0]?.done, runs.done++));
    });
    setStore((draft) => {
      draft.user.name = "Luis";
    });
    expect(runs).toEqual({ name: 2, age: 1, count: 1, done: 1 });
    setStore((draft) => {
      draft.todos.push({ title: "b", done: false });
    });
    expect(runs.count).toBe(2);
    setStore((draft) => {
      (draft.todos[0] as { done: boolean }).done = true;
    });
    expect(runs.done).toBe(2);
    expect(store.todos.map((todo) => todo.title)).toEqual(["a", "b"]);
  });

  it("tracks added and deleted keys, and batches one update", () => {
    const [store, setStore] = createStore<{ tags: Record<string, boolean>; a: number; b: number }>({ tags: {}, a: 1, b: 1 });
    let keys: string[] = [];
    let sums = 0;
    createRoot(() => {
      effect(() => void (keys = Object.keys(store.tags)));
      effect(() => void (store.a + store.b, sums++));
    });
    setStore((draft) => {
      draft.tags.x = true;
      draft.a = 2;
      draft.b = 2;
    });
    expect(keys).toEqual(["x"]);
    expect(sums).toBe(2);
    setStore((draft) => {
      delete draft.tags.x;
    });
    expect(keys).toEqual([]);
  });

  it("refuses writes outside the update function", () => {
    const [store] = createStore({ a: 1 });
    expect(() => {
      store.a = 2;
    }).toThrow(/read-only/);
  });
});

describe("createI18n", () => {
  const i18n = createI18n({
    locale: "en" as "en" | "es",
    messages: {
      en: { hi: "Hi {name}", items: { one: "{count} item", other: "{count} items" }, onlyEnglish: "Only here" },
      es: { hi: "Hola {name}", items: { one: "{count} elemento", other: "{count} elementos" } } as never,
    },
  });

  it("translates with parameters and plurals, reactively", () => {
    let text = "";
    createRoot(() => effect(() => void (text = `${i18n.t("hi", { name: "Ana" })} / ${i18n.t("items", { count: 1 })} / ${i18n.t("items", { count: 3 })}`)));
    expect(text).toBe("Hi Ana / 1 item / 3 items");
    i18n.setLocale("es");
    expect(text).toBe("Hola Ana / 1 elemento / 3 elementos");
  });

  it("falls back to the first locale, then to the key, and formats numbers", () => {
    i18n.setLocale("es");
    expect(i18n.t("onlyEnglish")).toBe("Only here");
    expect(i18n.t("missing" as never)).toBe("missing");
    expect(i18n.number(1234.5)).toMatch(/1\.?234,5/);
  });
});

describe("createForm", () => {
  function setup(onSubmit = vi.fn()) {
    const form = createForm({
      initial: { email: "", terms: false },
      validate: {
        email: (value) => (value.includes("@") ? undefined : "Enter an email address."),
        terms: (value) => (value ? undefined : "Accept the terms."),
      },
      onSubmit,
    });
    return { form, onSubmit };
  }

  it("shows an error only after the field was left, and links it for screen readers", () => {
    const { form } = setup();
    const email = form.field("email");
    expect(email["aria-invalid"]).toBeUndefined();
    email.onBlur();
    expect(form.error("email")).toBe("Enter an email address.");
    expect(email["aria-invalid"]).toBe("true");
    expect(email["aria-describedby"]).toBe(form.errorProps("email").id);
    expect(form.errorProps("email").role).toBe("alert");
  });

  it("reads text and checkbox input", () => {
    const { form } = setup();
    const input = Object.assign(document.createElement("input"), { value: "a@b.co" });
    form.field("email").onInput({ currentTarget: input } as unknown as Event);
    const box = Object.assign(document.createElement("input"), { type: "checkbox", checked: true });
    form.field("terms").onInput({ currentTarget: box } as unknown as Event);
    expect(form.values()).toEqual({ email: "a@b.co", terms: true });
    expect(form.field("email").value).toBe("a@b.co");
    expect(form.field("terms").checked).toBe(true);
  });

  it("on a failed submit shows every error, focuses the first invalid field and does not submit", async () => {
    const { form, onSubmit } = setup();
    const element = document.createElement("form");
    element.innerHTML = '<input id="field-email" /><input id="field-terms" type="checkbox" />';
    document.body.append(element);
    await form.submit({ preventDefault() {}, currentTarget: element } as unknown as Event);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(form.errors().map((item) => item.name)).toEqual(["email", "terms"]);
    expect(document.activeElement?.id).toBe("field-email");
    element.remove();
  });

  it("submits valid values and resets", async () => {
    const { form, onSubmit } = setup();
    const input = Object.assign(document.createElement("input"), { value: "a@b.co" });
    form.field("email").onInput({ currentTarget: input } as unknown as Event);
    const box = Object.assign(document.createElement("input"), { type: "checkbox", checked: true });
    form.field("terms").onInput({ currentTarget: box } as unknown as Event);
    await form.submit();
    expect(onSubmit).toHaveBeenCalledWith({ email: "a@b.co", terms: true });
    form.reset();
    expect(form.values()).toEqual({ email: "", terms: false });
    expect(form.errors()).toEqual([]);
  });
});
