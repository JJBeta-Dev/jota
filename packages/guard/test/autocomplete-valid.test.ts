import rule from "../src/rules/autocomplete-valid.js";
import { tester } from "./tester.js";

tester.run("jota/autocomplete-valid", rule, {
  valid: [
    { code: '<input autoComplete="email" />' },
    { code: '<input autoComplete="off" />' },
    { code: '<input autoComplete="given-name" />' },
    { code: '<input autoComplete="shipping postal-code" />' },
    { code: '<input autoComplete="section-blue billing cc-number" />' },
    { code: '<input autoComplete="home tel" />' },
    { code: '<input autoComplete="username webauthn" />' },
    { code: "<input autoComplete={value} />" },
    { code: '<Field autoComplete="nonsense" />' },
  ],
  invalid: [
    { code: '<input autoComplete="e-mail" />', errors: [{ messageId: "invalidAutocomplete", data: { value: "e-mail" } }] },
    { code: '<input autoComplete="firstname" />', errors: [{ messageId: "invalidAutocomplete" }] },
    { code: '<input autoComplete="" />', errors: [{ messageId: "invalidAutocomplete" }] },
    { code: '<input autoComplete="home name" />', errors: [{ messageId: "invalidAutocomplete" }] },
    { code: '<input autocomplete="email email" />', errors: [{ messageId: "invalidAutocomplete" }] },
  ],
});
