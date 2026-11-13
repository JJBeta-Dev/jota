import { batch, signal, type Accessor } from "./reactive.js";

type Values = Record<string, string | boolean>;

export interface FormOptions<T extends Values> {
  initial: T;
  /** One function per field. Return the message to show, or undefined when the value is valid. */
  validate?: { [K in keyof T]?: (value: T[K], values: T) => string | undefined };
  /** Called with the values when every field is valid. */
  onSubmit: (values: T) => void | Promise<void>;
  /** Prefix for the ids that link each field with its error message. Default: "field". */
  id?: string;
}

export interface FieldProps {
  name: string;
  id: string;
  value: string | undefined;
  checked: boolean | undefined;
  "aria-invalid": "true" | undefined;
  "aria-describedby": string | undefined;
  onInput: (event: Event) => void;
  onBlur: () => void;
}

export interface Form<T extends Values> {
  values: Accessor<T>;
  /** The message of a field. Empty until the field was left or the form was submitted. */
  error: (name: keyof T & string) => string | undefined;
  /** Every message currently shown, in field order: use it for an error summary. */
  errors: Accessor<Array<{ name: keyof T & string; message: string }>>;
  submitting: Accessor<boolean>;
  /** Spread on the control: `<input {...form.field("email")} />`. Links it to its error for screen readers. */
  field: (name: keyof T & string) => FieldProps;
  /** Spread on the element that shows the error: `<p {...form.errorProps("email")}>{form.error("email")}</p>`. */
  errorProps: (name: keyof T & string) => { id: string; role: "alert" };
  /** Use as the form's `onSubmit`. Shows every error and moves focus to the first invalid field. */
  submit: (event?: Event) => Promise<void>;
  reset: () => void;
}

/**
 * Form state with accessible validation: each control gets `aria-invalid` and `aria-describedby`
 * pointing at its message, messages are announced, and a failed submit focuses the first problem.
 */
export function createForm<T extends Values>(options: FormOptions<T>): Form<T> {
  const prefix = options.id ?? "field";
  const names = Object.keys(options.initial) as Array<keyof T & string>;
  const [values, setValues] = signal<T>({ ...options.initial });
  const [touched, setTouched] = signal<ReadonlySet<string>>(new Set());
  const [submitting, setSubmitting] = signal(false);

  const check = (name: keyof T & string): string | undefined => options.validate?.[name]?.(values()[name], values());
  const error = (name: keyof T & string) => (touched().has(name) ? check(name) : undefined);
  const errors = () =>
    names.flatMap((name) => {
      const message = error(name);
      return message === undefined ? [] : [{ name, message }];
    });

  function field(name: keyof T & string): FieldProps {
    const value = () => values()[name];
    return {
      name,
      id: `${prefix}-${name}`,
      get value() {
        const current = value();
        return typeof current === "string" ? current : undefined;
      },
      get checked() {
        const current = value();
        return typeof current === "boolean" ? current : undefined;
      },
      get "aria-invalid"() {
        return error(name) === undefined ? undefined : ("true" as const);
      },
      get "aria-describedby"() {
        return error(name) === undefined ? undefined : `${prefix}-${name}-error`;
      },
      onInput(event) {
        const target = event.currentTarget as HTMLInputElement;
        const next = target.type === "checkbox" ? target.checked : target.value;
        setValues((current) => ({ ...current, [name]: next }));
      },
      onBlur() {
        if (!touched().has(name)) setTouched((current) => new Set(current).add(name));
      },
    };
  }

  async function submit(event?: Event): Promise<void> {
    event?.preventDefault();
    setTouched(() => new Set(names));
    const first = names.find((name) => check(name) !== undefined);
    if (first !== undefined) {
      const root = event?.currentTarget instanceof Element ? event.currentTarget : document;
      (root.querySelector(`#${prefix}-${first}`) as HTMLElement | null)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await options.onSubmit(values());
    } finally {
      setSubmitting(false);
    }
  }

  return {
    values,
    error,
    errors,
    submitting,
    field,
    errorProps: (name) => ({ id: `${prefix}-${name}-error`, role: "alert" }),
    submit,
    reset: () =>
      batch(() => {
        setValues(() => ({ ...options.initial }));
        setTouched(() => new Set());
      }),
  };
}
