import { Form, redirect } from "react-router";
import { loginLogout } from "~/client";
import { Button } from "~/components/ui/button";
import { destroySession, getSession } from "~/sessions.server";
import type { Route } from "./+types/logout";

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const refreshToken = session.get("refreshToken");
  if (refreshToken) {
    await loginLogout({ body: { refresh_token: refreshToken } });
  }
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export default function LogoutRoute() {
  return (
    <>
      <p>Are you sure you want to log out?</p>
      <Form method="post">
        <Button>Logout</Button>
      </Form>
    </>
  );
}
