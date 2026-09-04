import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import { authSessionContext } from "~/lib/auth.server";
import { commitSession, getSession } from "~/sessions.server";
import type { Route } from "./+types/root";
import "./app.css";

export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }, next) => {
    const authSession = {
      session: await getSession(request.headers.get("Cookie")),
      needsCommit: false,
    };
    context.set(authSessionContext, authSession);

    const response = await next();
    // A route-authored cookie must win. In particular, if a refreshed retry is
    // also rejected, logoutIfUnauthorized returns a cookie that destroys this
    // session and must not be overwritten with the newly refreshed values.
    if (authSession.needsCommit && !response.headers.has("Set-Cookie")) {
      response.headers.append("Set-Cookie", await commitSession(authSession.session));
    }
    return response;
  },
];

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

// oxlint-disable-next-line eslint/no-empty-pattern -- React Router v7 convention
export function meta({}: Route.MetaArgs) {
  return [{ title: "Scholark" }];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        {/* Stack traces must not leak in production builds */}
        {import.meta.env.DEV && error.stack ? (
          <>
            <p>The stack trace is:</p>
            <pre>{error.stack}</pre>
          </>
        ) : null}
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}
