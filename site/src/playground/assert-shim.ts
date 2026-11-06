// `@babel/helper-module-imports` calls Node's `assert(condition, message)`. The browser has no `assert`,
// so this stands in for it. Only the default export exists on purpose: CommonJS code that does
// `require("assert")` then receives the function itself.
export default function assert(condition: unknown, message?: string | Error): asserts condition {
  if (!condition) throw message instanceof Error ? message : new Error(message ?? "Assertion failed");
}
