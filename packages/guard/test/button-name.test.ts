import rule from "../src/rules/button-name.js";
import { tester } from "./tester.js";

tester.run("jota/button-name", rule, {
  valid: [
    { code: "<button>Save</button>" },
    { code: '<button aria-label="Close dialog"><svg aria-hidden="true" /></button>' },
    { code: '<button aria-labelledby="title-id" />' },
    { code: "<button>{label}</button>" },
    { code: "<button><Icon /></button>" },
    { code: '<button title="Close"><svg /></button>' },
    { code: "<button {...props} />" },
    { code: '<button><svg><title>Close</title></svg></button>' },
    { code: '<div role="button" aria-label="Menu" />' },
  ],
  invalid: [
    { code: "<button />", errors: [{ messageId: "missingName" }] },
    {
      code: '<button><svg aria-hidden="true" /></button>',
      errors: [{ messageId: "missingName" }],
    },
    { code: '<button aria-label="">  </button>', errors: [{ messageId: "missingName" }] },
    { code: "<button>{/* nothing */}</button>", errors: [{ messageId: "missingName" }] },
    { code: '<div role="button" />', errors: [{ messageId: "missingName" }] },
    {
      code: '<button><img src="/i.svg" alt="" /></button>',
      errors: [{ messageId: "missingName" }],
    },
  ],
});
