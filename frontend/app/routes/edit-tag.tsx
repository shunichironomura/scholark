import { data, redirect } from "react-router";
import type { TagUpdate } from "~/client";
import { tagsReadTag, tagsUpdateTag } from "~/client";
import { logoutIfUnauthorized, requireSession } from "~/lib/auth.server";
import type { Route } from "./+types/edit-tag";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { session, authHeaders } = await requireSession(request);
  const {
    data: tag,
    error,
    response,
  } = await tagsReadTag({
    path: { tag_id: params.tagId },
    headers: authHeaders,
  });
  if (error) {
    await logoutIfUnauthorized(session, response);
    throw data("Conference not found", { status: 404 });
  }
  return { tag };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { session, authHeaders } = await requireSession(request);
  const formData = await request.formData();
  const tagName = formData.get("name") as string | null;
  const tagColor = formData.get("color") as string | null;

  const tagUpdate: TagUpdate = {
    name: tagName ?? undefined,
    color: tagColor ?? undefined,
  };

  const { error, response } = await tagsUpdateTag({
    path: { tag_id: params.tagId },
    headers: authHeaders,
    body: tagUpdate,
  });
  if (error) {
    await logoutIfUnauthorized(session, response);
    throw data("Tag not found", { status: 404 });
  }
  return redirect("/settings");
}
