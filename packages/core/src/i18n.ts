import { signal, type Accessor } from "./reactive.js";

/** A message is a string with `{name}` placeholders, or plural forms chosen by the `count` parameter. */
export type Message = string | Partial<Record<Intl.LDMLPluralRule, string>>;
export type Messages = Record<string, Message>;

export interface I18nOptions<L extends string, M extends Messages> {
  /** The starting locale. */
  locale: L;
  /** Used when the current locale has no text for a key. Default: the starting locale. */
  fallback?: L;
  /** Every locale must have the keys of the first one; TypeScript reports a missing or misspelled key. */
  messages: Record<L, M>;
}

export interface I18n<L extends string, M extends Messages> {
  locale: Accessor<L>;
  setLocale: (locale: L) => void;
  /** Translate. Reactive: text using it updates when the locale changes. */
  t: (key: keyof M & string, params?: Record<string, string | number>) => string;
  number: (value: number, options?: Intl.NumberFormatOptions) => string;
  date: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string;
}

/**
 * Small typed translations on top of the browser's `Intl`.
 * `const { t, setLocale } = createI18n({ locale: "en", messages: { en: { hi: "Hi {name}" }, es: { hi: "Hola {name}" } } })`
 */
export function createI18n<L extends string, M extends Messages>(options: I18nOptions<L, M>): I18n<L, M> {
  const [locale, setLocale] = signal<L>(options.locale);
  const fallback = options.fallback ?? options.locale;
  const plurals = new Map<string, Intl.PluralRules>();

  function pick(message: Message, current: L, params?: Record<string, string | number>): string | undefined {
    if (typeof message === "string") return message;
    const count = Number(params?.count ?? 0);
    let rules = plurals.get(current);
    if (!rules) plurals.set(current, (rules = new Intl.PluralRules(current)));
    return message[rules.select(count)] ?? message.other;
  }

  function t(key: keyof M & string, params?: Record<string, string | number>): string {
    const current = locale();
    const own = options.messages[current]?.[key];
    const text =
      (own !== undefined ? pick(own, current, params) : undefined) ??
      (options.messages[fallback]?.[key] !== undefined ? pick(options.messages[fallback][key] as Message, fallback, params) : undefined);
    if (text === undefined) return key;
    return text.replace(/\{(\w+)\}/g, (match, name: string) => (params && name in params ? String(params[name]) : match));
  }

  return {
    locale,
    setLocale: (next) => void setLocale(() => next),
    t,
    number: (value, format) => new Intl.NumberFormat(locale(), format).format(value),
    date: (value, format) => new Intl.DateTimeFormat(locale(), format).format(value),
  };
}
