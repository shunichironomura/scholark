import { data, redirect } from "react-router";
import { conferencesSubscribeToConference, conferencesUnsubscribeFromConference } from "~/client";
import { logoutIfUnauthorized, requireSession } from "~/lib/auth.server";
import type { Route } from "./+types/conference-subscribe";

export async function action({ request, params, context }: Route.ActionArgs) {
  const { session, client } = await requireSession(context);

  if (!params.conferenceId) {
    throw data("Conference ID is required", { status: 400 });
  }

  if (request.method === "DELETE") {
    const { error, response } = await conferencesUnsubscribeFromConference({
      path: { conference_id: params.conferenceId },
      client,
    });
    if (error) {
      await logoutIfUnauthorized(session, response);
      throw data("Failed to unsubscribe", { status: 500 });
    }
  } else {
    const { error, response } = await conferencesSubscribeToConference({
      path: { conference_id: params.conferenceId },
      client,
    });
    if (error) {
      await logoutIfUnauthorized(session, response);
      throw data("Failed to subscribe", { status: 500 });
    }
  }

  return redirect("/conferences");
}
