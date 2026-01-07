/**
 * Shared utilities for generators.
 */

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Pluralize a word with common English rules.
 */
export function pluralize(str: string): string {
  const lower = str.toLowerCase();
  
  // Irregular plurals
  const irregulars: Record<string, string> = {
    person: "people",
    child: "children",
    man: "men",
    woman: "women",
    tooth: "teeth",
    foot: "feet",
    mouse: "mice",
    goose: "geese",
  };
  
  if (irregulars[lower]) {
    // Preserve original casing
    return str.charAt(0) === str.charAt(0).toUpperCase()
      ? capitalize(irregulars[lower])
      : irregulars[lower];
  }
  
  // Already plural or uncountable
  if (lower.endsWith("s") || lower.endsWith("x") || lower.endsWith("z")) {
    if (lower.endsWith("ss") || lower.endsWith("us") || lower.endsWith("is")) {
      return str + "es";
    }
    return str;
  }
  
  // Words ending in consonant + y
  if (lower.endsWith("y") && !/[aeiou]y$/.test(lower)) {
    return str.slice(0, -1) + "ies";
  }
  
  // Words ending in ch, sh, x, z, s
  if (/(?:ch|sh|x|z|s)$/.test(lower)) {
    return str + "es";
  }
  
  // Words ending in f or fe
  if (lower.endsWith("f")) {
    return str.slice(0, -1) + "ves";
  }
  if (lower.endsWith("fe")) {
    return str.slice(0, -2) + "ves";
  }
  
  // Default: add s
  return str + "s";
}

/**
 * Convert to kebab-case (for URLs).
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * Convert to snake_case (for database tables).
 */
export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}
