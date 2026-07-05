import { redirect } from "react-router";
import { getSession } from "~/sessions.server";

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
