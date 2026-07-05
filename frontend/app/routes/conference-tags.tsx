import { data, redirect } from "react-router";
import { conferencesUpdateTagsForConference } from "~/client";
import type { Option } from "~/components/ui/multi-select";
import { logoutIfUnauthorized, requireSession } from "~/lib/auth.server";
import type { Route } from "./+types/conference-tags";

export async function action({ request, params }: Route.ActionArgs) {
  const { session, authHeaders } = await requireSession(request);

  const formData = await request.formData();
  const tags = JSON.parse(formData.get("tags") as string) as Option[];

  if (!params.conferenceId) {
    throw data("Conference ID is required", { status: 400 });
  }
  const { error, response } = await conferencesUpdateTagsForConference({
    path: { conference_id: params.conferenceId },
    headers: authHeaders,
    body: tags.map((tag) => tag.value),
  });
  if (error) {
    await logoutIfUnauthorized(session, response);
    throw data("Conference not found", { status: 404 });
  }

  return redirect("/conferences");
}
