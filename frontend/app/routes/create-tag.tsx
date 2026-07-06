import { data, redirect } from "react-router";
import type { TagCreate } from "~/client";
import { tagsCreateTag } from "~/client";
import { logoutIfUnauthorized, requireSession } from "~/lib/auth.server";
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
