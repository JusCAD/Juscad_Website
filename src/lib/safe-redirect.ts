export const DEFAULT_REDIRECT_PATH = "/settings";

const FALLBACK_ORIGIN = "https://juscad.com";

/**
 * Returns a same-origin path for post-auth redirects, or `fallback` when
 * `next` could leave the site. URL parsers treat `\` as `/` and silently drop
 * tabs/newlines, so `/\evil.com` or `/\t/evil.com` would become `//evil.com`.
 */
export function getSafeRedirectPath(
  next: string | null | undefined,
  origin: string = FALLBACK_ORIGIN,
  fallback: string = DEFAULT_REDIRECT_PATH,
): string {
  if (typeof next !== "string" || next.length === 0 || next.length > 2048) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  if (next.includes("\\") || /[\u0000-\u001f\u007f]/.test(next)) return fallback;

  try {
    const base = new URL(origin);
    const resolved = new URL(next, base.origin);
    if (resolved.origin !== base.origin) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
