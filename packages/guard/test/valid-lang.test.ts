import rule from "../src/rules/valid-lang.js";
import { tester } from "./tester.js";

tester.run("jota/valid-lang", rule, {
  valid: [
    { code: '<html lang="en" />' },
    { code: '<p lang="es-CO">hola</p>' },
    { code: '<html lang="zh-Hant-TW" />' },
    { code: "<html lang={locale} />" },
    { code: '<span lang="">?</span>' },
    { code: '<Page lang="english" />' },
  ],
  invalid: [
    { code: '<html lang="english" />', errors: [{ messageId: "invalidLang", data: { value: "english" } }] },
    { code: '<p lang="e">x</p>', errors: [{ messageId: "invalidLang" }] },
    { code: '<html lang="en_US" />', errors: [{ messageId: "invalidLang" }] },
    { code: '<span lang="es CO" />', errors: [{ messageId: "invalidLang" }] },
    { code: "<html lang={`123`} />", errors: [{ messageId: "invalidLang" }] },
  ],
});
