import type { ESLint, Linter } from "eslint";
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
