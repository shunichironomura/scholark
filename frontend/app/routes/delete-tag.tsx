import { useState } from "react";
import { data, Form, redirect, useNavigate } from "react-router";
import type { TagPublic, TagUpdate } from "~/client";
import { tagsDeleteTag, tagsReadTag, tagsUpdateTag } from "~/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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

  const { data: tag, error } = await tagsDeleteTag({
    path: { tag_id: params.tagId },
    headers: { Authorization: `Bearer ${session.get("accessToken")}` },
  });
  if (error) {
    throw data("Tag not found", { status: 404 });
  }
  return redirect("/settings");
}
