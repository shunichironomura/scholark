import { redirect } from "react-router";
import { destroySession, getSession } from "~/sessions.server";

type Session = Awaited<ReturnType<typeof getSession>>;

export interface AuthenticatedSession {
  session: Session;
  token: string;
  authHeaders: { Authorization: string };
}

/**
 * Load the session for a request and require a logged-in user.
 * Throws a redirect to /login when no access token is present.
 */
export async function requireSession(request: Request): Promise<AuthenticatedSession> {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("accessToken");
  if (!token) {
    throw redirect("/login");
  }
  return { session, token, authHeaders: { Authorization: `Bearer ${token}` } };
}

/**
 * If the API rejected the request's credentials (expired token, or a disabled
 * or deleted user), destroy the session and redirect to the login page.
 *
 * The session cookie outlives the JWT, so without this every loader threw a
 * generic 500 and stranded returning users on an error page. Call after an
 * API error before converting it into an error response.
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
