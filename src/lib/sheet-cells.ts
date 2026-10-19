const FORMULA_TRIGGERS = new Set(["=", "+", "-", "@", "\t", "\r"]);

/**
 * Spreadsheet apps evaluate cells that start with these characters as
 * formulas. A leading apostrophe forces the value to be shown as plain text.
 */
export function sanitizeSheetCell<T>(value: T): T | string {
  if (typeof value !== "string" || value.length === 0) return value;
  return FORMULA_TRIGGERS.has(value[0]) ? `'${value}` : value;
}
