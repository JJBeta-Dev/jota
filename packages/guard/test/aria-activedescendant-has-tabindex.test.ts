import rule from "../src/rules/aria-activedescendant-has-tabindex.js";
import { tester } from "./tester.js";

tester.run("jota/aria-activedescendant-has-tabindex", rule, {
  valid: [
    { code: '<div aria-activedescendant="opt1" tabIndex={0} />' },
    { code: '<ul aria-activedescendant={id} tabIndex={-1} />' },
    { code: '<input aria-activedescendant="opt1" />' },
    { code: '<div aria-activedescendant="x" tabIndex={order} />' },
    { code: '<div role="listbox" />' },
    { code: '<Box aria-activedescendant="x" />' },
    { code: '<div aria-activedescendant="x" {...props} />' },
  ],
  invalid: [
    {
      code: '<div aria-activedescendant="opt1" />',
      errors: [{ messageId: "needsTabIndex", data: { tag: "div" } }],
    },
    { code: '<ul role="listbox" aria-activedescendant={id} />', errors: [{ messageId: "needsTabIndex" }] },
    { code: '<span aria-activedescendant="a" />', errors: [{ messageId: "needsTabIndex" }] },
    { code: '<a aria-activedescendant="a">no href</a>', errors: [{ messageId: "needsTabIndex" }] },
    { code: '<div aria-activedescendant="a" tabIndex />', errors: [{ messageId: "needsTabIndex" }] },
  ],
});
