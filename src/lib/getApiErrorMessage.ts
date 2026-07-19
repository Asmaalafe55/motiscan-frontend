import { ApiError } from "@/lib/api";

export function getApiErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (err instanceof ApiError) {
    if (err.code === "TIMEOUT") {
      return "The request took too long. The server may be waking up — please try again in a moment.";
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
