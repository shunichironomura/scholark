import { Trash2 } from "lucide-react";
import { useState } from "react";
import { data, Form, redirect, useNavigate } from "react-router";
import type { ConferenceCreate, ConferenceMilestoneCreate, ConferencesUpdateConferenceData } from "~/client";
import { conferencesReadConference, conferencesUpdateConference } from "~/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/edit-conference";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("accessToken")) {
    return redirect("/login");
  }
  const { data: conference, error } = await conferencesReadConference({
    path: { conference_id: params.conferenceId },
    headers: { Authorization: `Bearer ${session.get("accessToken")}` },
  });
  if (error) {
    throw data("Conference not found", { status: 404 });
  }
  return { conference };
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("accessToken")) {
    return redirect("/login");
  }
  const formData = await request.formData();
  const updates = Object.fromEntries(formData) as Record<string, string | null>;
  // For fields other than name, set to null if empty
  Object.keys(updates).forEach((field) => {
    if (field !== "name" && updates[field] === "") {
      updates[field] = null;
    }
  });

  // Extract the milestones fields from the form data
  const milestoneIndices = Object.keys(updates)
    .filter((key) => key.startsWith("milestone_name__"))
    .map((key) => parseInt(key.split("__")[1], 10))
    .filter((index) => updates[`milestone_name__${index}`] && updates[`milestone_date__${index}`]);

  const milestones: ConferenceMilestoneCreate[] = milestoneIndices
    .map((index): ConferenceMilestoneCreate | null => {
      const name = updates[`milestone_name__${index}`];
      const date = updates[`milestone_date__${index}`];
      if (name == null || date == null) {
        return null;
      }
      return { name, date };
    })
    .filter((milestone): milestone is ConferenceMilestoneCreate => milestone !== null);
  const requestBody: ConferenceCreate = {
    name: updates.name ?? "New Conference",
    start_date: updates.start_date,
    end_date: updates.end_date,
    location: updates.location,
    website_url: updates.website_url,
    milestones: milestones,
  };

  await conferencesUpdateConference({
    path: { conference_id: params.conferenceId },
    body: requestBody,
    headers: { Authorization: `Bearer ${session.get("accessToken")}` },
  });
  return redirect(`/conferences`);
}

export default function EditConference({ loaderData }: Route.ComponentProps) {
  const { conference } = loaderData;
  const navigate = useNavigate();

  const [milestones, setMilestones] = useState<number[]>(conference.milestones.map((_, i) => i));

  return (
    <Form key={conference.id} id="conference-form" method="post">
      <div className="max-w-2xl mx-auto space-y-6">
        <p className="text-sm text-yellow-600 mb-4">
          Changes made here are shared and will affect all users.
          <br />
          Only admins can delete a conference. If you want to delete a conference, please contact an admin.
        </p>
        <div className="space-y-1">
          <Label htmlFor="name">Conference Name</Label>
          <Input id="name" name="name" type="text" defaultValue={conference.name} placeholder="Conference Name" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            name="start_date"
            type="date"
            defaultValue={conference.start_date ?? ""}
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            name="end_date"
            type="date"
            defaultValue={conference.end_date ?? ""}
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            type="text"
            defaultValue={conference.location ?? ""}
            placeholder="Location"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="website-url">Website URL</Label>
          <Input
            id="website-url"
            name="website_url"
            type="url"
            defaultValue={conference.website_url ?? ""}
            placeholder="https://example.com"
          />
        </div>
        {milestones.map((milestoneIndex, index) => (
          <div key={milestoneIndex} className="flex flex-row space-x-4 items-end">
            <div className="flex flex-col flex-3 space-y-1">
              <Label htmlFor={`milestone_name__${milestoneIndex}`}>Milestone Name</Label>
              <Input
                id={`milestone_name__${milestoneIndex}`}
                name={`milestone_name__${milestoneIndex}`}
                type="text"
                defaultValue={conference.milestones[milestoneIndex]?.name ?? ""}
                placeholder="Milestone Name"
              />
            </div>
            <div className="flex flex-col flex-2 space-y-1">
              <Label htmlFor={`milestone_date__${milestoneIndex}`}>Milestone Date</Label>
              <Input
                id={`milestone_date__${milestoneIndex}`}
                name={`milestone_date__${milestoneIndex}`}
                type="date"
                defaultValue={conference.milestones[milestoneIndex]?.date ?? ""}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setMilestones(milestones.filter((_, i) => i !== index))}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            onClick={() => setMilestones([...milestones, milestones.length > 0 ? Math.max(...milestones) + 1 : 0])}
          >
            Add Milestone
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button type="submit">Save</Button>
          <Button onClick={() => navigate(-1)} type="button" variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </Form>
  );
}
