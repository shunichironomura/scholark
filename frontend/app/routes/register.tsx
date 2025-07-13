import { data, redirect, useFetcher } from "react-router";
import { usersRegisterUser } from "~/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { Route } from "./+types/register";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const username = String(formData.get("username"));
  const password = String(formData.get("password"));
  const confirmPassword = String(formData.get("confirm_password"));

  const errors: Record<string, string> = {};

  // Check confirm password
  if (password !== confirmPassword) {
    errors.password = "Passwords do not match.";
  }
  if (password.length < 8) {
    errors.password = (errors.password ? errors.password + " " : "") + "Password must be at least 8 characters long.";
  }
  if (password.length > 40) {
    errors.password = (errors.password ? errors.password + " " : "") + "Password must be at most 40 characters long.";
  }
  if (Object.keys(errors).length > 0) {
    return data({ errors }, { status: 400 });
  }

  const { data: data_, error } = await usersRegisterUser({
    body: {
      username: username,
      password: password,
    },
  });

  if (error) {
    return data({
      errors: { general: "username already exists" },
      status: 400,
    });
  }

  return redirect("/login");
}

export default function Register(_: Route.ComponentProps) {
  const fetcher = useFetcher();
  const errors = fetcher.data?.errors;

  return (
    <div>
      <h1 className="text-4xl font-bold mb-4">Register</h1>
      <fetcher.Form method="post">
        <div className="mb-4">
          <Label htmlFor="username">Username</Label>
          <Input type="username" id="username" name="username" required />
        </div>
        <div className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input type="password" id="password" name="password" required />
        </div>
        <div className="mb-4">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input type="password" id="confirm-password" name="confirm_password" required />
          {errors?.password ? <div className="text-red-500">{errors.password}</div> : null}
        </div>
        {errors?.general ? <div className="mb-4 text-red-500">{errors.general}</div> : null}
        <Button type="submit">Register</Button>
      </fetcher.Form>
    </div>
  );
}
