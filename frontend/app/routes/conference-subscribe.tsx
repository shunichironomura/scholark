import { data, redirect } from "react-router";
import { conferencesSubscribeToConference, conferencesUnsubscribeFromConference } from "~/client";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/conference-subscribe";

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("accessToken")) {
    return redirect("/login");
  }

  if (!params.conferenceId) {
    throw data("Conference ID is required", { status: 400 });
  }

  const token = session.get("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  if (request.method === "DELETE") {
    const { error } = await conferencesUnsubscribeFromConference({
      path: { conference_id: params.conferenceId },
      headers,
    });
    if (error) {
      throw data("Failed to unsubscribe", { status: 500 });
    }
  } else {
    const { error } = await conferencesSubscribeToConference({
      path: { conference_id: params.conferenceId },
      headers,
    });
    if (error) {
      throw data("Failed to subscribe", { status: 500 });
    }
  }

  return redirect("/conferences");
}
