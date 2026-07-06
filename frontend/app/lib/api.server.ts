import type { ConferencePublic, TagPublic } from "~/client";
import { conferencesReadConferences, tagsReadTags } from "~/client";

/** Page size for list endpoints; the backend clamps limit to at most 100. */
const PAGE_LIMIT = 100;

interface FetchAllResult<T> {
  data?: { data: T[]; count: number };
  error?: unknown;
  response?: Response;
}

/**
 * Fetch every page of the conferences list. A single request returns at
 * most 100 rows, so without paging the 101st conference silently
 * disappears while count still reports the true total.
 */
export async function fetchAllConferences(headers: {
  Authorization: string;
}): Promise<FetchAllResult<ConferencePublic>> {
  const all: ConferencePublic[] = [];
  for (let skip = 0; ; skip += PAGE_LIMIT) {
    const { data, error, response } = await conferencesReadConferences({
      headers,
      query: { skip, limit: PAGE_LIMIT },
    });
    if (error || !data) {
      return { error, response };
    }
    all.push(...data.data);
    if (all.length >= data.count || data.data.length === 0) {
      return { data: { data: all, count: all.length }, response };
    }
  }
}

/** Fetch every page of the current user's tags. */
export async function fetchAllTags(headers: {
  Authorization: string;
}): Promise<FetchAllResult<TagPublic>> {
  const all: TagPublic[] = [];
  for (let skip = 0; ; skip += PAGE_LIMIT) {
    const { data, error, response } = await tagsReadTags({
      headers,
      query: { skip, limit: PAGE_LIMIT },
    });
    if (error || !data) {
      return { error, response };
    }
    all.push(...data.data);
    if (all.length >= data.count || data.data.length === 0) {
      return { data: { data: all, count: all.length }, response };
    }
  }
}

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
