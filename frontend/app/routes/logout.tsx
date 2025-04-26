
import { Form, data, Link, redirect, useNavigate } from "react-router";
import type { Route } from "./+types/logout";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { getSession, destroySession } from "~/sessions.server";
import { loginLoginAccessToken } from "~/client";

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
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
