/**
 * Extracts a single string from Express query/params values which can be string | string[].
 * Always returns the first value if array, or empty string if undefined.
 */
export function qs(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? '';
  return val ?? '';
}
