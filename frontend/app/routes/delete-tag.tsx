import { data, redirect } from "react-router";
import { tagsDeleteTag } from "~/client";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/delete-tag";

// export async function loader({ request, params }: Route.LoaderArgs) {
//   const session = await getSession(request.headers.get("Cookie"));
//   if (!session.has("accessToken")) {
//     return redirect("/login");
//   }
//   const { data: tag, error } = await tagsReadTag({
//     path: { tag_id: params.tagId },
//     headers: { Authorization: `Bearer ${session.get("accessToken")}` },
//   });
//   if (error) {
//     throw data("Conference not found", { status: 404 });
//   }
//   return { tag };
// }

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("accessToken")) {
    return redirect("/login");
  }

  const { error } = await tagsDeleteTag({
    path: { tag_id: params.tagId },
    headers: { Authorization: `Bearer ${session.get("accessToken")}` },
  });
  if (error) {
    throw data("Tag not found", { status: 404 });
  }
  return redirect("/settings");
}
