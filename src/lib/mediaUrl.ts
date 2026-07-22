import { getApiBaseUrl } from "@/lib/getApiBaseUrl";

const API_URL = getApiBaseUrl();

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

  // Rewrite any absolute /uploads/... URL to the current API host.
  // Fixes old suspended Render host (motiscan-backend.onrender.com) and localhost.
  const uploadsMatch = trimmed.match(/^(https?:\/\/[^/]+)(\/uploads\/.+)$/i);
  if (uploadsMatch) {
    return `${API_URL}${uploadsMatch[2]}`;
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

/** First visual asset to show as an exercise card thumbnail. */
export function getExercisePreviewSrc(exercise: {
  type: string;
  question?: {
    differenceImages?: { image1Url?: string; image2Url?: string };
    shapeCopyConfig?: { rows?: { model_snapshot?: string }[] };
    analyticalPerceptionConfig?: {
      cells?: { design_svg?: string; section_svg?: string }[];
    };
  };
}): string | null {
  const q = exercise.question;
  if (!q) return null;

  if (exercise.type === "differences" && q.differenceImages?.image1Url) {
    return resolveMediaUrl(q.differenceImages.image1Url);
  }

  if (exercise.type === "shape_copy") {
    const snap = q.shapeCopyConfig?.rows?.[0]?.model_snapshot;
    if (snap) return resolveMediaUrl(snap);
  }

  if (exercise.type === "analytical_perception") {
    const cell = q.analyticalPerceptionConfig?.cells?.[0];
    const svg = cell?.design_svg || cell?.section_svg;
    if (svg) return resolveMediaUrl(svg);
  }

  return null;
}
