import { RouterContextProvider } from "react-router";
import { describe, expect, test } from "vite-plus/test";
import { authSessionContext } from "~/lib/auth.server";
import { destroySession, getSession } from "~/sessions.server";
import { middleware } from "./root";

async function runAuthMiddleware(
  next: (context: RouterContextProvider) => Promise<Response>,
): Promise<Response> {
  const authMiddleware = middleware[0];
  if (!authMiddleware) {
    throw new Error("Auth middleware is not configured");
  }

  const context = new RouterContextProvider();
  const request = new Request("https://example.com/conferences");
  const response = await authMiddleware(
    {
      request,
      url: new URL(request.url),
      params: {},
      context,
      pattern: "/",
    },
    () => next(context),
  );
  if (!(response instanceof Response)) {
    throw new Error("Auth middleware did not return a response");
  }
  return response;
}

describe("root auth middleware", () => {
  test("commits refreshed credentials on an error response", async () => {
    const response = await runAuthMiddleware(async (context) => {
      const state = context.get(authSessionContext);
      state.session.set("accessToken", "refreshed-access-token");
      state.session.set("refreshToken", "rotated-refresh-token");
      state.needsCommit = true;
      return new Response("Loader failed", { status: 500 });
    });

    expect(response.status).toBe(500);
    const setCookie = response.headers.get("Set-Cookie");
    expect(setCookie).toBeTruthy();
    const committed = await getSession(setCookie?.split(";", 1)[0]);
    expect(committed.get("accessToken")).toBe("refreshed-access-token");
    expect(committed.get("refreshToken")).toBe("rotated-refresh-token");
  });

  test("does not overwrite a route cookie after a refresh", async () => {
    let routeCookie: string | undefined;
    const response = await runAuthMiddleware(async (context) => {
      const state = context.get(authSessionContext);
      state.session.set("accessToken", "refreshed-access-token");
      state.session.set("refreshToken", "rotated-refresh-token");
      state.needsCommit = true;
      routeCookie = await destroySession(state.session);
      return new Response(null, { headers: { "Set-Cookie": routeCookie } });
    });

    expect(response.headers.get("Set-Cookie")).toBe(routeCookie);
    expect(response.headers.get("Set-Cookie")).toContain("Expires=Thu, 01 Jan 1970");
  });
});
