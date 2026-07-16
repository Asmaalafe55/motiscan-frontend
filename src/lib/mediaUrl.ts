const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(
  /\/$/,
  ""
);

/** Turn exercise media paths/inline SVG into a browser-loadable URL. */
export function resolveMediaUrl(src: string | undefined | null): string {
  if (!src) return "";
  const trimmed = src.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("data:")) return trimmed;

  if (trimmed.startsWith("<svg") || trimmed.startsWith("<?xml")) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(trimmed)}`;
  }

  if (trimmed.startsWith("/uploads/")) {
    return `${API_URL}${trimmed}`;
  }

  const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1):5000/i;
  if (localhostPattern.test(trimmed)) {
    return trimmed.replace(localhostPattern, API_URL);
  }

  return trimmed;
}

export function resolveDifferenceImages(images: {
  image1Url: string;
  image2Url: string;
}): { image1Url: string; image2Url: string } {
  return {
    image1Url: resolveMediaUrl(images.image1Url),
    image2Url: resolveMediaUrl(images.image2Url),
  };
}
