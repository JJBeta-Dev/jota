import type { ESLint, Linter } from "eslint";
import iframeTitle from "./rules/iframe-title.js";
import noAutofocus from "./rules/no-autofocus.js";
import noRedundantAlt from "./rules/no-redundant-alt.js";
import ariaHiddenFocusable from "./rules/aria-hidden-focusable.js";
import noDistractingElements from "./rules/no-distracting-elements.js";
import noAccessKey from "./rules/no-access-key.js";
import validLang from "./rules/valid-lang.js";
import ariaRoleValid from "./rules/aria-role-valid.js";
import headingHasContent from "./rules/heading-has-content.js";
import mouseEventsHaveKeyEvents from "./rules/mouse-events-have-key-events.js";
import ariaProps from "./rules/aria-props.js";
import noRedundantRoles from "./rules/no-redundant-roles.js";
import noNoninteractiveTabindex from "./rules/no-noninteractive-tabindex.js";
import scopeValid from "./rules/scope-valid.js";
import ariaUnsupportedElements from "./rules/aria-unsupported-elements.js";
import anchorAmbiguousText from "./rules/anchor-ambiguous-text.js";
import buttonName from "./rules/button-name.js";
import clickableRole from "./rules/clickable-role.js";
import headingOrder from "./rules/heading-order.js";
import htmlLang from "./rules/html-lang.js";
import imgAlt from "./rules/img-alt.js";
import imgSize from "./rules/img-size.js";
import inputLabel from "./rules/input-label.js";
import linkName from "./rules/link-name.js";
import mediaCaptions from "./rules/media-captions.js";
import noPositiveTabindex from "./rules/no-positive-tabindex.js";
import { presetRules, type PresetName } from "./presets.js";

export const rules = {
  "img-alt": imgAlt,
  "img-size": imgSize,
  "clickable-role": clickableRole,
  "button-name": buttonName,
  "link-name": linkName,
  "input-label": inputLabel,
  "heading-order": headingOrder,
  "html-lang": htmlLang,
  "no-positive-tabindex": noPositiveTabindex,
  "media-captions": mediaCaptions,
  "iframe-title": iframeTitle,
  "no-autofocus": noAutofocus,
  "no-redundant-alt": noRedundantAlt,
  "aria-hidden-focusable": ariaHiddenFocusable,
  "no-distracting-elements": noDistractingElements,
  "no-access-key": noAccessKey,
  "valid-lang": validLang,
  "aria-role-valid": ariaRoleValid,
  "heading-has-content": headingHasContent,
  "mouse-events-have-key-events": mouseEventsHaveKeyEvents,
  "aria-props": ariaProps,
  "no-redundant-roles": noRedundantRoles,
  "no-noninteractive-tabindex": noNoninteractiveTabindex,
  "scope-valid": scopeValid,
  "aria-unsupported-elements": ariaUnsupportedElements,
  "anchor-ambiguous-text": anchorAmbiguousText,
};

const plugin: ESLint.Plugin = { rules };

const makeConfig = (name: PresetName): Linter.Config => ({
  plugins: { jota: plugin },
  rules: presetRules(name),
});

export const configs: Record<PresetName, Linter.Config> = {
  recommended: makeConfig("recommended"),
  strict: makeConfig("strict"),
  "a11y-only": makeConfig("a11y-only"),
};

export { PRESET_NAMES, presetRules, type PresetName } from "./presets.js";
export default plugin;
