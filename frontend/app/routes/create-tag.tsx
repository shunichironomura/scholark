import { data, redirect } from "react-router";
import type { TagCreate } from "~/client";
import { tagsCreateTag } from "~/client";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/create-tag";

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

  const formData = await request.formData();
  const tagName = formData.get("name") as string;
  const tagColor = formData.get("color") as string | null;

  const tagCreate: TagCreate = {
    name: tagName,
    color: tagColor ?? "#000000",
  };

  const { data: tag, error } = await tagsCreateTag({
    headers: { Authorization: `Bearer ${session.get("accessToken")}` },
    body: tagCreate,
  });
  if (error) {
    throw data("Tag not found", { status: 404 });
  }
  return redirect("/settings");
}
