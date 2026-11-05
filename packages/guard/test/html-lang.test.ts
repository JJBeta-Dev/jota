import rule from "../src/rules/html-lang.js";
import { tester } from "./tester.js";

tester.run("jota/html-lang", rule, {
  valid: [
    { code: '<html lang="en"><body /></html>' },
    { code: '<html lang="es-CO"><body /></html>' },
    { code: "<html lang={locale}><body /></html>" },
    { code: "<html {...props}><body /></html>" },
    { code: "<div>not html</div>" },
  ],
  invalid: [
    { code: "<html><body /></html>", errors: [{ messageId: "missingLang" }] },
    { code: '<html lang=""><body /></html>', errors: [{ messageId: "missingLang" }] },
    { code: '<html dir="ltr"><body /></html>', errors: [{ messageId: "missingLang" }] },
    { code: '<html lang="  "><body /></html>', errors: [{ messageId: "missingLang" }] },
    { code: "const page = <html><head /></html>;", errors: [{ messageId: "missingLang" }] },
  ],
});
