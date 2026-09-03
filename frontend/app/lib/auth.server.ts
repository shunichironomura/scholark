import { createContext, redirect } from "react-router";
import type { RouterContextProvider } from "react-router";
import { loginRefreshAccessToken } from "~/client";
import type { Token } from "~/client";
import { createClient } from "~/client/client";
import type { Client } from "~/client/client";
import { createClientConfig } from "~/hey-api";
import { destroySession, getSession } from "~/sessions.server";

type Session = Awaited<ReturnType<typeof getSession>>;

export interface AuthSessionState {
  session: Session;
  needsCommit: boolean;
}

export const authSessionContext = createContext<AuthSessionState>();

export interface AuthenticatedSession {
  session: Session;
  client: Client;
}

const refreshRequests = new Map<string, Promise<Token | undefined>>();

function refreshTokens(refreshToken: string): Promise<Token | undefined> {
  const activeRequest = refreshRequests.get(refreshToken);
  if (activeRequest) {
    return activeRequest;
  }

  const request = loginRefreshAccessToken({
    body: { refresh_token: refreshToken },
  })
    .then(({ data }) => data)
    .finally(() => refreshRequests.delete(refreshToken));
  refreshRequests.set(refreshToken, request);
  return request;
}

/**
 * Require a logged-in session and create a request-scoped API client. When a
 * protected call returns 401, the client refreshes the token pair and retries
 * that call once.
 */
export async function requireSession(
  context: Readonly<RouterContextProvider>,
): Promise<AuthenticatedSession> {
  const state = context.get(authSessionContext);
  const { session } = state;
  let accessToken = session.get("accessToken");
  let refreshToken = session.get("refreshToken");
  if (!accessToken && !refreshToken) {
    throw redirect("/login");
  }

  const client = createClient(
    createClientConfig({
      auth: () => accessToken,
      fetch: async (input, init) => {
        const request = new Request(input, init);
        const retryRequest = request.clone();
        const response = await fetch(request);
        if (response.status !== 401 || !refreshToken) {
          return response;
        }

        const tokens = await refreshTokens(refreshToken);
        if (!tokens) {
          return response;
        }

        accessToken = tokens.access_token;
        refreshToken = tokens.refresh_token;
        session.set("accessToken", accessToken);
        session.set("refreshToken", refreshToken);
        state.needsCommit = true;

        const headers = new Headers(retryRequest.headers);
        headers.set("Authorization", `Bearer ${accessToken}`);
        return fetch(new Request(retryRequest, { headers }));
      },
    }),
  );

  return { session, client };
}

/**
 * If the API rejected the request's credentials (expired token, or a disabled
 * or deleted user), destroy the session and redirect to the login page.
 *
 * The request-scoped client has already attempted one refresh by this point,
 * so a remaining 401 means neither credential can authenticate the session.
 */
export async function logoutIfUnauthorized(
  session: Session,
  response: Response | undefined,
): Promise<void> {
  if (response?.status === 401) {
    throw redirect("/login", {
      headers: { "Set-Cookie": await destroySession(session) },
    });
  }
}
