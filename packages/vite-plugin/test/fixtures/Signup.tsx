import { createForm } from "../../../core/src/form.js";

export const saved: Array<{ email: string }> = [];

export function Signup() {
  const form = createForm({
    initial: { email: "" },
    validate: { email: (value) => (value.includes("@") ? undefined : "Enter an email address.") },
    onSubmit: (values) => void saved.push(values),
  });
  return (
    <form onSubmit={form.submit} noValidate>
      <label for="field-email">Email</label>
      <input type="email" {...form.field("email")} />
      <p {...form.errorProps("email")}>{form.error("email")}</p>
      <button type="submit">Join</button>
    </form>
  );
}
