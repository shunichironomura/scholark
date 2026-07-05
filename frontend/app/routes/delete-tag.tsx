import { data, redirect } from "react-router";
import { tagsDeleteTag } from "~/client";
import { logoutIfUnauthorized, requireSession } from "~/lib/auth.server";
import type { Route } from "./+types/delete-tag";

export async function action({ request, params }: Route.ActionArgs) {
  const { session, authHeaders } = await requireSession(request);

  const { error, response } = await tagsDeleteTag({
    path: { tag_id: params.tagId },
    headers: authHeaders,
  });
  if (error) {
    await logoutIfUnauthorized(session, response);
    throw data("Tag not found", { status: 404 });
  }
  return redirect("/settings");
}
