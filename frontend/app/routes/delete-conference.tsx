import { data, redirect } from "react-router";
import { conferencesDeleteConference } from "~/client";
import { requireSession } from "~/lib/auth.server";
import type { Route } from "./+types/delete-conference";

export async function action({ request, params }: Route.ActionArgs) {
  const { authHeaders } = await requireSession(request);

  if (!params.conferenceId) {
    throw data("Conference ID is required", { status: 400 });
  }
  await conferencesDeleteConference({
    path: { conference_id: params.conferenceId },
    headers: authHeaders,
  });
  return redirect("/conferences");
}
