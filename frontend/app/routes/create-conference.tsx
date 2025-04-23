import { Form, Outlet, redirect, useNavigate } from "react-router";
import type { Route } from "./+types/create-conference";
import { Button } from "~/components/ui/button";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  return { conferenceId: params.conferenceId };
}

export async function clientAction({ request, params }: Route.ActionArgs) {
}

export default function CreateConference({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <div>
      <Button onClick={() => navigate(-1)} type="button">
        Cancel
      </Button>
    </div>
  )

}
