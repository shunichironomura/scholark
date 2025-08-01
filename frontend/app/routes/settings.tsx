import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { data, Form, redirect, useNavigation } from "react-router";
import { tagsReadTags, usersReadUserMe } from "~/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { pickLabelTextColor } from "~/lib/color";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/settings";
// User settings
// - Add/edit/delete user tags
// - iCal feed
// - Change password
// - Change username

// export async function action({ request, params }: Route.ActionArgs) {
//   const session = await getSession(request.headers.get("Cookie"));
//   if (!session.has("accessToken")) {
//     return redirect("/login");
//   }
//   const formData = await request.formData();
//   console.log("Form data:", formData);
// }

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("accessToken")) {
    return redirect("/login");
  }

  const { data: user, error: userError } = await usersReadUserMe({
    headers: { Authorization: `Bearer ${session.get("accessToken")}` },
  });
  if (userError || !user) {
    throw data("User not found", { status: 404 });
  }

  const { data: userTags, error: userTagsError } = await tagsReadTags({
    headers: { Authorization: `Bearer ${session.get("accessToken")}` },
  });
  if (userTagsError || !userTags) {
    throw data("User tags not found", { status: 404 });
  }
  return { user, userTags };
}

/** ------------------------------------------------------------------
 * Re‑usable dialog that shows a form to edit or create a tag.
 * It validates the color (must be #rgb or #rrggbb) on the client
 * and renders a live preview chip from the current inputs.
 * ------------------------------------------------------------------*/
function TagDialog({
  tag,
  action,
  trigger,
  dialogKey,
  openTagId,
  setOpenTagId,
}: {
  /** Existing tag (for edit) or { id:"", name:"", color:"#000000" } for new */
  tag: { id: string; name: string; color: string };
  /** The form action URL (e.g. "/tags/123/edit" or "/tags/new") */
  action: string;
  /** The element that opens the dialog (DialogTrigger’s child) */
  trigger: React.ReactElement;
  /** Unique key that identifies this dialog (usually the tag id). */
  dialogKey: string;
  /** The id of the dialog that is currently open (lifted‑state). */
  openTagId: string | null;
  /** Setter to change the open dialog id. */
  setOpenTagId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  // const [open, setOpen] = useState(false);
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);

  /** Simple HEX color validator */
  const HEX_RE = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
  const colourIsValid = HEX_RE.test(color);

  return (
    <Dialog open={openTagId === dialogKey} onOpenChange={(open) => setOpenTagId(open ? dialogKey : null)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent>
        <Form action={action} method="post">
          <DialogHeader>
            <DialogTitle>{tag.id ? "Edit tag" : "Add new tag"}</DialogTitle>
            <DialogDescription>
              Color must be a HEX value such as <code>#ff00ff</code> or <code>#0f0</code>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`tag-name-${tag.id}`}>Name</Label>
              <Input
                id={`tag-name-${tag.id}`}
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`tag-color-${tag.id}`}>Color</Label>
              <Input
                id={`tag-color-${tag.id}`}
                name="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="col-span-3"
                pattern="^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$"
                title="HEX color like #ff00ff or #0f0"
              />
            </div>

            {/* Live preview */}
            <div className="col-span-4">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: colourIsValid ? color : "#e5e7eb" /* gray‑200 */,
                  color: colourIsValid ? pickLabelTextColor(color) : "#000000",
                }}
              >
                {name || "Preview"}
              </span>
              {!colourIsValid && <p className="mt-2 text-sm text-destructive">Invalid HEX color</p>}
            </div>
          </div>

          <DialogFooter>
            {tag.id && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="icon">
                    <Trash2 />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <Form action={`/tags/${tag.id}/delete`} method="post">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete the tag.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction type="submit">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </Form>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button type="submit" disabled={!colourIsValid} aria-disabled={!colourIsValid}>
              {tag.id ? "Save changes" : "Add"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Settings({ loaderData }: Route.ComponentProps) {
  const { user, userTags } = loaderData;
  const navigation = useNavigation();
  const [openTagId, setOpenTagId] = useState<string | null>(null);
  useEffect(() => {
    if (navigation.state === "idle") {
      setOpenTagId(null);
    }
  }, [navigation.state]);
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">Settings</h1>

      <h2 className="text-2xl font-bold mb-4">User</h2>
      <div className="mb-6">
        <p className="text-lg font-medium">Username: {user.username}</p>
        <p className="text-sm text-zinc-500">User ID: {user.id}</p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Tags</h2>
      <p className="text-sm text-gray-500 mb-2">
        These tags are personal. Any changes you make here will not affect other users.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {userTags.data.map((tag) => {
          return (
            <TagDialog
              key={tag.id}
              tag={tag}
              action={`/tags/${tag.id}/edit`}
              trigger={
                <span
                  style={{
                    backgroundColor: tag.color,
                    color: pickLabelTextColor(tag.color),
                  }}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer"
                >
                  {tag.name}
                </span>
              }
              dialogKey={tag.id}
              openTagId={openTagId}
              setOpenTagId={setOpenTagId}
            />
          );
        })}
      </div>
      {/* Add tag */}
      <TagDialog
        tag={{ id: "", name: "", color: "#000000" }}
        action="/tags/new"
        trigger={
          <Button variant="outline">
            <Plus className="mr-2" /> Add new tag
          </Button>
        }
        dialogKey="new"
        openTagId={openTagId}
        setOpenTagId={setOpenTagId}
      />
    </>
  );
}
