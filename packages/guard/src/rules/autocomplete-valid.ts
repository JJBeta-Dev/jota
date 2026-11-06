import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { findAttribute, isDomTag, staticString, tagName, type JSXOpeningElementNode } from "../jsx.js";

const FIELDS = new Set([
  "name",
  "honorific-prefix",
  "given-name",
  "additional-name",
  "family-name",
  "honorific-suffix",
  "nickname",
  "email",
  "username",
  "new-password",
  "current-password",
  "one-time-code",
  "organization-title",
  "organization",
  "street-address",
  "address-line1",
  "address-line2",
  "address-line3",
  "address-level4",
  "address-level3",
  "address-level2",
  "address-level1",
  "country",
  "country-name",
  "postal-code",
  "cc-name",
  "cc-given-name",
  "cc-additional-name",
  "cc-family-name",
  "cc-number",
  "cc-exp",
  "cc-exp-month",
  "cc-exp-year",
  "cc-csc",
  "cc-type",
  "transaction-currency",
  "transaction-amount",
  "language",
  "bday",
  "bday-day",
  "bday-month",
  "bday-year",
  "sex",
  "url",
  "photo",
  "tel",
  "tel-country-code",
  "tel-national",
  "tel-area-code",
  "tel-local",
  "tel-extension",
  "impp",
]);
const CONTACT = new Set(["home", "work", "mobile", "fax", "pager"]);
const CONTACT_FIELDS = new Set(["tel", "tel-country-code", "tel-national", "tel-area-code", "tel-local", "tel-extension", "email", "impp"]);

function isValid(value: string): boolean {
  const tokens = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  if (tokens.length === 1 && (tokens[0] === "on" || tokens[0] === "off")) return true;
  let rest = tokens;
  if (rest[0]?.startsWith("section-")) rest = rest.slice(1);
  if (rest[0] === "shipping" || rest[0] === "billing") rest = rest.slice(1);
  if (rest.length === 2 && CONTACT.has(rest[0] as string) && CONTACT_FIELDS.has(rest[1] as string)) return true;
  if (rest[rest.length - 1] === "webauthn") rest = rest.slice(0, -1);
  if (rest.length === 2 && CONTACT.has(rest[0] as string) && CONTACT_FIELDS.has(rest[1] as string)) return true;
  return rest.length === 1 && FIELDS.has(rest[0] as string);
}

export default createRule({
  id: "autocomplete-valid",
  level: "error",
  description: "Require autoComplete values from the HTML list.",
  messages: {
    invalidAutocomplete:
      'autoComplete="{{value}}" is not a valid value. Use one from the HTML list, such as "email", "given-name" or "current-password".',
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        if (!isDomTag(tagName(element))) return;
        const attr = findAttribute(element, "autoComplete") ?? findAttribute(element, "autocomplete");
        const value = staticString(attr);
        if (value === undefined || isValid(value)) return;
        context.report({ node: attr as unknown as Rule.Node, messageId: "invalidAutocomplete", data: { value } });
      },
    };
  },
});
