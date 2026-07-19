/** Normalize backend base URL from env (no trailing slash, no /api suffix). */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  return raw.trim().replace(/\/+$/, "").replace(/\/api$/i, "");
}
