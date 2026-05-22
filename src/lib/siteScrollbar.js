const SKIPPED_PATH_PREFIXES = ["/admin", "/admin-login", "/write"];

export function shouldEnableSiteScrollbar(pathname = "") {
  const normalizedPath = String(pathname || "/").split(/[?#]/, 1)[0] || "/";

  return !SKIPPED_PATH_PREFIXES.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  );
}
