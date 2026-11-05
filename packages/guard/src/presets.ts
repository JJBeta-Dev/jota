export type Level = "error" | "warn" | "off";

/** Default severity of every Guard rule (see docs/guard-rules.md). */
export const DEFAULT_LEVELS = {
  "img-alt": "error",
  "img-size": "warn",
  "clickable-role": "error",
  "button-name": "error",
  "link-name": "error",
  "input-label": "error",
  "heading-order": "warn",
  "html-lang": "error",
  "no-positive-tabindex": "warn",
  "media-captions": "warn",
} as const satisfies Record<string, Level>;

export type RuleId = keyof typeof DEFAULT_LEVELS;
export type PresetName = "recommended" | "strict" | "a11y-only";

export const PRESET_NAMES: readonly PresetName[] = ["recommended", "strict", "a11y-only"];

/** Rule levels for a preset, keyed by the full ESLint rule name (`jota/<id>`). */
export function presetRules(name: PresetName): Record<string, Level> {
  const result: Record<string, Level> = {};
  for (const [id, level] of Object.entries(DEFAULT_LEVELS) as Array<[RuleId, Level]>) {
    let final: Level = level;
    if (name === "strict" && level === "warn") final = "error";
    if (name === "a11y-only" && id === "img-size") final = "off";
    result[`jota/${id}`] = final;
  }
  return result;
}
