import { data, redirect } from "react-router";
import type { TagCreate } from "~/client";
import { tagsCreateTag } from "~/client";
import { logoutIfUnauthorized, requireSession } from "~/lib/auth.server";
import type { Route } from "./+types/create-tag";

export async function action({ request }: Route.ActionArgs) {
  const { session, authHeaders } = await requireSession(request);

  const formData = await request.formData();
  const tagName = formData.get("name") as string;
  const tagColor = formData.get("color") as string | null;

  const tagCreate: TagCreate = {
    name: tagName,
    color: tagColor ?? "#000000",
  };

  const { error, response } = await tagsCreateTag({
    headers: authHeaders,
    body: tagCreate,
  });
  if (error) {
    await logoutIfUnauthorized(session, response);
    throw data("Failed to create the tag", { status: response?.status ?? 500 });
  }
  return redirect("/settings");
}
