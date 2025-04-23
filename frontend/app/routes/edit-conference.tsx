import { Form, Outlet, data, redirect, useNavigate } from "react-router";
import type { Route } from "./+types/edit-conference";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { conferencesUpdateConference, conferencesReadConference } from "~/client";
import type { ConferencesCreateConferenceData, ConferencesCreateConferenceResponses, ConferencesUpdateConferenceData } from "~/client";
import { MapPin, Plus, Trash2, Pencil, CalendarIcon } from "lucide-react";
import { useState } from "react";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { data: conference, error } = await conferencesReadConference({ path: { conference_id: params.conferenceId } });
  if (error) {
    throw data("Conference not found", { status: 404 });
  }
  return { conference };
}

export async function clientAction({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const updates = Object.fromEntries(formData) as Record<string, string | null>;
  // For fields other than name, set to null if empty
  Object.keys(updates).forEach((field) => {
    if (field !== "name" && updates[field] === "") {
      updates[field] = null;
    }
  });
  console.log(updates);

  await conferencesUpdateConference({
    path: { conference_id: params.conferenceId },
    body: updates as ConferencesUpdateConferenceData["body"],
  });
  return redirect(`/conferences`);
}

export default function EditConference({ loaderData }: Route.ComponentProps) {
  const { conference } = loaderData;
  const navigate = useNavigate();

  return (
    <Form key={conference.id} id="conference-form" method="post">
      <div>
        <Label htmlFor="name">Conference Name</Label>
        <Input id="name" name="name" type="text" defaultValue={conference.name} placeholder="Conference Name" />
      </div>
      <div>
        <Label htmlFor="start-date">Start Date</Label>
        <Input id="start-date" name="start_date" type="date" defaultValue={conference.start_date ?? ""} placeholder="YYYY-MM-DD" />
      </div>
      <div>
        <Label htmlFor="end-date">End Date</Label>
        <Input id="end-date" name="end_date" type="date" defaultValue={conference.end_date ?? ""} placeholder="YYYY-MM-DD" />
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" type="text" defaultValue={conference.location ?? ""} placeholder="Location" />
      </div>
      <div>
        <Label htmlFor="website-url">Website URL</Label>
        <Input id="website-url" name="website_url" type="url" defaultValue={conference.website_url ?? ""} placeholder="https://example.com" />
      </div>
      <div>
        <Label htmlFor="abstract-deadline">Abstract Deadline</Label>
        <Input id="abstract-deadline" name="abstract_deadline" type="date" defaultValue={conference.abstract_deadline ?? ""} placeholder="YYYY-MM-DD" />
      </div>
      <div>
        <Label htmlFor="paper-deadline">Paper Deadline</Label>
        <Input id="paper-deadline" name="paper_deadline" type="date" defaultValue={conference.paper_deadline ?? ""} placeholder="YYYY-MM-DD" />
      </div>
      <div className="flex items-center space-x-2">
        <Button type="submit">
          Save
        </Button>
        <Button onClick={() => navigate(-1)} type="button" variant="outline">
          Cancel
        </Button>
      </div>
    </Form >
  )

}
