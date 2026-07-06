/**
 * Extract a human-readable message from an API error body, falling back to
 * the given message. FastAPI errors carry a `detail` string (HTTPException)
 * or a structured validation error we don't try to render.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "detail" in error &&
    typeof (error as { detail?: unknown }).detail === "string"
  ) {
    return (error as { detail: string }).detail;
  }
  return fallback;
}
