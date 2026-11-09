/** Returns the first code point of a string, or `""` when it is empty. */
function firstCodePoint(value: string): string {
  return Array.from(value)[0] ?? "";
}

/**
 * Derives avatar initials from a display name or email.
 *
 * - Empty/whitespace input yields `""`.
 * - One word yields its first letter.
 * - Two or more words yield the first letters of the first and last words.
 *
 * Characters are taken by code point so surrogate pairs are never split, and
 * the result never exceeds two characters.
 */
export function getInitials(value: string): string {
  const segments = value.trim().split(/\s+/).filter(Boolean);

  if (segments.length === 0) {
    return "";
  }

  const first = firstCodePoint(segments[0]);
  const last =
    segments.length > 1 ? firstCodePoint(segments[segments.length - 1]) : "";

  return Array.from(`${first}${last}`.toUpperCase()).slice(0, 2).join("");
}
