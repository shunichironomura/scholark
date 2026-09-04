import { data, redirect } from "react-router";
import { conferencesDeleteConference } from "~/client";
import { apiErrorMessage } from "~/lib/api.server";
import { logoutIfUnauthorized, requireSession } from "~/lib/auth.server";
import type { Route } from "./+types/delete-conference";

export async function action({ params, context }: Route.ActionArgs) {
  const { session, client } = await requireSession(context);

  if (!params.conferenceId) {
    throw data("Conference ID is required", { status: 400 });
  }
  const { error, response } = await conferencesDeleteConference({
    path: { conference_id: params.conferenceId },
    client,
  });
  if (error) {
    await logoutIfUnauthorized(session, response);
    throw data(apiErrorMessage(error, "Failed to delete the conference."), {
      status: response?.status ?? 500,
    });
  }
  return redirect("/conferences");
}
