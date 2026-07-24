/**
 * Returns a string safe to assign to an <img src> or Image.src.
 *
 * Raw inline SVG markup (e.g. "<svg …>…</svg>") cannot be used directly as an
 * image source — the browser treats it as a relative URL and the request 404s
 * (and Image.onload never fires). Wrapping it in a UTF-8 data URI fixes that.
 *
 * Values that are already a data URI, an http(s) URL, or an absolute/relative
 * path are returned unchanged.
 */
export function toImageSrc(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trimStart();
  if (trimmed.startsWith("<svg") || trimmed.startsWith("<?xml")) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`;
  }
  return value;
}
