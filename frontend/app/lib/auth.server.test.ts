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

async function authenticatedContext() {
  const session = await getSession();
  session.set("accessToken", "expired-access-token");
  session.set("refreshToken", "valid-refresh-token");
  const state = { session, needsCommit: false };
  const context = new RouterContextProvider();
  context.set(authSessionContext, state);
  return { context, state };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("authenticated API client", () => {
  test("refreshes an expired access token and retries the request once", async () => {
    const requests: Request[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init);
        requests.push(request);

        if (new URL(request.url).pathname.endsWith("/login/refresh")) {
          expect(await request.json()).toEqual({ refresh_token: "valid-refresh-token" });
          return jsonResponse({
            access_token: "new-access-token",
            refresh_token: "rotated-refresh-token",
            token_type: "bearer",
          });
        }
        if (request.headers.get("Authorization") === "Bearer expired-access-token") {
          return jsonResponse({ detail: "Could not validate credentials" }, 401);
        }
        return jsonResponse({
          id: "11111111-1111-1111-1111-111111111111",
          username: "alice",
          is_superuser: false,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          slack_user_id: null,
        });
      }),
    );
    const { context, state } = await authenticatedContext();
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

  test("redirects to login when access and refresh credentials are rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ detail: "Could not validate credentials" }, 401)),
    );
    const { context } = await authenticatedContext();
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
