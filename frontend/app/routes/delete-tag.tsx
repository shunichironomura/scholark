import { data, redirect } from "react-router";
import { tagsDeleteTag } from "~/client";
import { logoutIfUnauthorized, requireSession } from "~/lib/auth.server";
import type { Route } from "./+types/delete-tag";

export async function action({ params, context }: Route.ActionArgs) {
  const { session, client } = await requireSession(context);

  const { error, response } = await tagsDeleteTag({
    path: { tag_id: params.tagId },
    client,
  });
  if (error) {
    await logoutIfUnauthorized(session, response);
    throw data("Tag not found", { status: 404 });
  }
  return redirect("/settings");
}
