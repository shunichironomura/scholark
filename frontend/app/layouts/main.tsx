import { isRouteErrorResponse, Outlet } from "react-router";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/main";
import { MainFrame } from "./main-frame";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const username = session.get("username");
  return { username };
}

export default function MainLayout({ loaderData }: Route.ComponentProps) {
  const { username } = loaderData;

  return (
    <MainFrame username={username}>
      <Outlet />
    </MainFrame>
  );
}

export function ErrorBoundary({ error, loaderData }: Route.ErrorBoundaryProps) {
  // Fetch `username` from the possibly-undefined loaderData
  const username = loaderData?.username;

  let body;
  if (isRouteErrorResponse(error)) {
    body = (
      <>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </>
    );
  } else if (error instanceof Error) {
    body = (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    body = <h1>Unknown Error</h1>;
  }
  return <MainFrame username={username}>{body}</MainFrame>;
}
