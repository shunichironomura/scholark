import { RouterContextProvider } from "react-router";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { usersReadUserMe } from "~/client";
import { getSession } from "~/sessions.server";
import { authSessionContext, logoutIfUnauthorized, requireSession } from "./auth.server";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function authenticatedContext(refreshToken: string) {
  const session = await getSession();
  session.set("accessToken", "expired-access-token");
  session.set("refreshToken", refreshToken);
  const state = { session, needsCommit: false };
  const context = new RouterContextProvider();
  context.set(authSessionContext, state);
  return { context, state };
}

function userResponse(): Response {
  return jsonResponse({
    id: "11111111-1111-1111-1111-111111111111",
    username: "alice",
    is_superuser: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    slack_user_id: null,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("authenticated API client", () => {
  test("refreshes an expired access token and retries the request once", async () => {
    const refreshToken = "valid-refresh-token-success";
    const requests: Request[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init);
        requests.push(request);

        if (new URL(request.url).pathname.endsWith("/login/refresh")) {
          expect(await request.json()).toEqual({ refresh_token: refreshToken });
          return jsonResponse({
            access_token: "new-access-token",
            refresh_token: "rotated-refresh-token",
            token_type: "bearer",
          });
        }
        if (request.headers.get("Authorization") === "Bearer expired-access-token") {
          return jsonResponse({ detail: "Could not validate credentials" }, 401);
        }
        return userResponse();
      }),
    );
    const { context, state } = await authenticatedContext(refreshToken);
    const { client } = await requireSession(context);

    const { data, error } = await usersReadUserMe({ client });

    expect(error).toBeUndefined();
    expect(data?.username).toBe("alice");
    expect(requests).toHaveLength(3);
    expect(requests[2]?.headers.get("Authorization")).toBe("Bearer new-access-token");
    expect(state.session.get("accessToken")).toBe("new-access-token");
    expect(state.session.get("refreshToken")).toBe("rotated-refresh-token");
    expect(state.needsCommit).toBe(true);
  });

  test("does not log out when the refresh endpoint returns a transient error", async () => {
    const refreshToken = "valid-refresh-token-transient-error";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init);
        if (new URL(request.url).pathname.endsWith("/login/refresh")) {
          return jsonResponse({ detail: "Service unavailable" }, 503);
        }
        return jsonResponse({ detail: "Could not validate credentials" }, 401);
      }),
    );
    const { context, state } = await authenticatedContext(refreshToken);
    const { client, session } = await requireSession(context);

    const { error, response } = await usersReadUserMe({ client });

    expect(error).toEqual({ detail: "Service unavailable" });
    expect(response).toBeUndefined();
    await expect(logoutIfUnauthorized(session, response)).resolves.toBeUndefined();
    expect(session.get("accessToken")).toBe("expired-access-token");
    expect(session.get("refreshToken")).toBe(refreshToken);
    expect(state.needsCommit).toBe(false);
  });

  test("deduplicates concurrent refresh requests while rotation is pending", async () => {
    const refreshToken = "valid-refresh-token-pending";
    let resolveRefresh!: () => void;
    const refreshGate = new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    });
    let refreshCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init);
        if (new URL(request.url).pathname.endsWith("/login/refresh")) {
          refreshCount += 1;
          await refreshGate;
          return jsonResponse({
            access_token: "new-pending-access-token",
            refresh_token: "rotated-pending-refresh-token",
            token_type: "bearer",
          });
        }
        if (request.headers.get("Authorization") === "Bearer expired-access-token") {
          return jsonResponse({ detail: "Could not validate credentials" }, 401);
        }
        return userResponse();
      }),
    );
    const { context, state } = await authenticatedContext(refreshToken);
    const { client } = await requireSession(context);

    const firstRequest = usersReadUserMe({ client });
    const secondRequest = usersReadUserMe({ client });
    await vi.waitFor(() => expect(refreshCount).toBe(1));
    resolveRefresh();
    const results = await Promise.all([firstRequest, secondRequest]);

    expect(results.every(({ error }) => error === undefined)).toBe(true);
    expect(refreshCount).toBe(1);
    expect(state.session.get("refreshToken")).toBe("rotated-pending-refresh-token");
    expect(state.needsCommit).toBe(true);
  });

  test("reuses a rotated token pair for a late overlapping request", async () => {
    const refreshToken = "valid-refresh-token-late-overlap";
    let refreshCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init);
        if (new URL(request.url).pathname.endsWith("/login/refresh")) {
          refreshCount += 1;
          return jsonResponse({
            access_token: "new-overlap-access-token",
            refresh_token: "rotated-overlap-refresh-token",
            token_type: "bearer",
          });
        }
        if (request.headers.get("Authorization") === "Bearer expired-access-token") {
          return jsonResponse({ detail: "Could not validate credentials" }, 401);
        }
        return userResponse();
      }),
    );
    const first = await authenticatedContext(refreshToken);
    const second = await authenticatedContext(refreshToken);
    const firstClient = (await requireSession(first.context)).client;
    const secondClient = (await requireSession(second.context)).client;

    const firstResult = await usersReadUserMe({ client: firstClient });
    const secondResult = await usersReadUserMe({ client: secondClient });

    expect(firstResult.error).toBeUndefined();
    expect(secondResult.error).toBeUndefined();
    expect(refreshCount).toBe(1);
    expect(first.state.session.get("refreshToken")).toBe("rotated-overlap-refresh-token");
    expect(second.state.session.get("refreshToken")).toBe("rotated-overlap-refresh-token");
    expect(first.state.needsCommit).toBe(true);
    expect(second.state.needsCommit).toBe(true);
  });

  test("redirects to login when access and refresh credentials are rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ detail: "Could not validate credentials" }, 401)),
    );
    const { context } = await authenticatedContext("rejected-refresh-token");
    const { client, session } = await requireSession(context);
    const { response } = await usersReadUserMe({ client });

    let redirect: unknown;
    try {
      await logoutIfUnauthorized(session, response);
    } catch (error) {
      redirect = error;
    }

    expect(redirect).toBeInstanceOf(Response);
    expect((redirect as Response).status).toBe(302);
    expect((redirect as Response).headers.get("Location")).toBe("/login");
    expect((redirect as Response).headers.get("Set-Cookie")).toContain("Expires=Thu, 01 Jan 1970");
  });
});
