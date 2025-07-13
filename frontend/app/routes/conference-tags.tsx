import { redirect, data } from "react-router";
import type { Route } from "./+types/conference-tags";
import { conferencesUpdateTagsForConference } from "~/client";
import { getSession } from "~/sessions.server";
import type { Option } from "~/components/ui/multi-select";

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("accessToken")) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const tags = JSON.parse(formData.get("tags") as string) as Option[];

  if (!params.conferenceId) {
    throw data("Conference ID is required", { status: 400 });
  }
  const { data: conference, error } = await conferencesUpdateTagsForConference({
    path: { conference_id: params.conferenceId },
    headers: { Authorization: `Bearer ${session.get("accessToken")}` },
    body: tags.map((tag) => tag.value),
  });
  if (error) {
    throw data("Conference not found", { status: 404 });
  }

  return redirect("/conferences");
}
