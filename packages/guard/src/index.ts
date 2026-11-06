import type { ESLint, Linter } from "eslint";
import iframeTitle from "./rules/iframe-title.js";
import noAutofocus from "./rules/no-autofocus.js";
import noRedundantAlt from "./rules/no-redundant-alt.js";
import ariaHiddenFocusable from "./rules/aria-hidden-focusable.js";
import noDistractingElements from "./rules/no-distracting-elements.js";
import noAccessKey from "./rules/no-access-key.js";
import validLang from "./rules/valid-lang.js";
import ariaRoleValid from "./rules/aria-role-valid.js";
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
