import { Form, data, redirect, useNavigate } from "react-router";
import type { Route } from "./+types/delete-tag";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { useState } from "react";
import { tagsReadTag, tagsUpdateTag, tagsDeleteTag } from "~/client";
import type { TagPublic, TagUpdate } from "~/client";
import { getSession } from "~/sessions.server";

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

  const { data: tag, error } = await tagsDeleteTag({
    path: { tag_id: params.tagId },
    headers: { Authorization: `Bearer ${session.get("accessToken")}` },
  });
  if (error) {
    throw data("Tag not found", { status: 404 });
  }
  return redirect("/settings");
}
