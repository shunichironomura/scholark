import { redirect, data } from "react-router";
import type { Route } from "./+types/delete-conference";
import { conferencesDeleteConference } from "~/client";


export async function clientAction({ params }: Route.ActionArgs) {
  if (!params.conferenceId) {
    throw data("Conference ID is required", { status: 400 });
  }
  await conferencesDeleteConference({ path: { conference_id: params.conferenceId } });
  return redirect("/conferences");
}
