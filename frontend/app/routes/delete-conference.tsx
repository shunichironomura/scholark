import { data, redirect } from "react-router";
import { conferencesDeleteConference } from "~/client";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/delete-conference";

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("accessToken")) {
    return redirect("/login");
  }

  if (!params.conferenceId) {
    throw data("Conference ID is required", { status: 400 });
  }
  await conferencesDeleteConference({
    path: { conference_id: params.conferenceId },
    headers: { Authorization: `Bearer ${session.get("accessToken")}` },
  });
  return redirect("/conferences");
}
