import { Form, data, redirect, useNavigate, useNavigation } from "react-router";
import type { Route } from "./+types/settings";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { useEffect, useState } from "react";
import { usersReadUserMe, tagsReadTags } from "~/client";
import { getSession } from "~/sessions.server";
import type { TagCreate, TagUpdate } from "~/client";
import { MapPin, Calendar, Plus, Trash2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
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
} from "~/components/ui/alert-dialog"
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

export async function loader({ request, params }: Route.LoaderArgs) {
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

export default function Settings({ loaderData }: Route.ComponentProps) {
  // Common interface between TagPublic, TagCreate, and TagUpdate
  interface Tag {
    id: string;
    name: string;
    color: string;
    isAdded?: boolean;
    toRemove?: boolean;
  }

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

      <div className="flex flex-wrap gap-2 mb-4">
        {userTags.data.map((tag) => {
          return (
            <Dialog open={openTagId === tag.id} onOpenChange={(open) => setOpenTagId(open ? tag.id : null)} key={tag.id}>
              <DialogTrigger asChild>
                <span
                  key={tag.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700"
                >
                  {tag.name}
                </span>
              </DialogTrigger>
              <DialogContent>
                <Form action={`/tags/${tag.id}/edit`} method="post">
                  <DialogHeader>
                    <DialogTitle>Edit tag</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="tag-name" className="text-right">
                        Name
                      </Label>
                      <Input id="tag-name" name="name" defaultValue={tag.name} className="col-span-3" />
                    </div>
                    {/* <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="color" className="text-right">
                      Color
                    </Label>
                    <Input id="color" value={tag.color} className="col-span-3" />
                  </div> */}
                    {/* Remove button */}
                  </div>
                  <DialogFooter className="flex justify-between items-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" size="icon">
                          <Trash2 />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <Form
                          action={`/tags/${tag.id}/delete`}
                          method="post"
                        >
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this tag.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction type="submit">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </Form>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button type="submit">Save changes</Button>
                  </DialogFooter>
                </Form>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
      {/* <Button onClick={() => setEditMode(true)}>Edit Tags</Button> */}
    </>
  );
}
