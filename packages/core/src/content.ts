type FieldType = "string" | "number" | "boolean" | "string[]";
type Field = FieldType | `${FieldType}?`;

type TypeOf<F extends Field> = F extends `${infer Base}?`
  ? TypeOfBase<Base> | undefined
  : F extends FieldType
    ? TypeOfBase<F>
    : never;
type TypeOfBase<B> = B extends "string" ? string : B extends "number" ? number : B extends "boolean" ? boolean : B extends "string[]" ? string[] : never;

export type Schema = Record<string, Field>;
export type DataOf<S extends Schema> = { [K in keyof S]: TypeOf<S[K]> };

export interface ContentFile {
  html: string;
  frontmatter: Record<string, unknown>;
  headings: Array<{ depth: number; text: string; id: string }>;
}

export interface Entry<S extends Schema> {
  /** The file name without folder or extension. */
  slug: string;
  data: DataOf<S>;
  html: string;
  headings: ContentFile["headings"];
}

function matches(value: unknown, type: FieldType): boolean {
  if (type === "string[]") return Array.isArray(value) && value.every((item) => typeof item === "string");
  return typeof value === type;
}

/**
 * Turn a folder of Markdown files into typed entries and check their front matter while building:
 * a missing or mistyped field stops the build and names the file.
 *
 * `const posts = defineCollection(import.meta.glob("./posts/*.md", { eager: true }), { title: "string", date: "string", draft: "boolean?" })`
 */
export function defineCollection<S extends Schema>(files: Record<string, unknown>, schema: S): Array<Entry<S>> {
  return Object.entries(files)
    .map(([path, module]) => {
      const file = module as ContentFile;
      const data: Record<string, unknown> = {};
      for (const [key, field] of Object.entries(schema)) {
        const optional = field.endsWith("?");
        const type = (optional ? field.slice(0, -1) : field) as FieldType;
        const value = file.frontmatter?.[key];
        if (value === undefined || value === null) {
          if (!optional) throw new Error(`${path}: front matter needs "${key}" (${type}).`);
          continue;
        }
        if (!matches(value, type)) {
          throw new Error(`${path}: "${key}" must be ${type}, got ${JSON.stringify(value)}.`);
        }
        data[key] = value;
      }
      const name = path.slice(path.lastIndexOf("/") + 1);
      const slug = name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name;
      return { slug, data: data as DataOf<S>, html: file.html, headings: file.headings ?? [] };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
