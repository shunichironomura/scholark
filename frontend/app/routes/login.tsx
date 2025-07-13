import { data, Form, Link, redirect, useNavigate } from "react-router";
import { loginLoginAccessToken, loginTestToken } from "~/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { commitSession, getSession } from "~/sessions.server";
import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("accessToken")) {
    return redirect("/conferences");
  }

  return data(
    { error: session.get("error") },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    },
  );
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  const formData = await request.formData();
  const { data: data_, error } = await loginLoginAccessToken({
    body: {
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    },
  });
  if (error || !data_) {
    session.flash("error", "Login failed");

    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  session.set("accessToken", data_.access_token);

  const { data: testTokenData, error: testTokenError } = await loginTestToken({
    headers: { Authorization: `Bearer ${data_.access_token}` },
  });
  if (testTokenError || !testTokenData) {
    session.flash("error", "Login failed");

    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  session.set("username", testTokenData.username);
  session.set("isSuperUser", testTokenData.is_superuser ?? false);

  return redirect("/conferences", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function Login({ loaderData }: Route.ComponentProps) {
  const { error } = loaderData;

  return (
    <div>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <h1 className="text-4xl font-bold mb-4">Login</h1>
      <Form method="post">
        <div className="mb-4">
          <Label htmlFor="username">Username</Label>
          <Input type="username" id="username" name="username" required />
        </div>
        <div className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input type="password" id="password" name="password" required />
        </div>
        <Button type="submit">Login</Button>
      </Form>
      {/* Show the link to the registration page in the center */}
      <div className="mt-4 text-center">
        <p className="mb-2">Don't have an account?</p>
        <Link to="/register" className="text-blue-500 hover:underline">
          Register here
        </Link>
      </div>
    </div>
  );
}
