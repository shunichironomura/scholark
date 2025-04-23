import type { Route } from "./+types/create-conference";
import { Form, redirect, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { conferencesCreateConference } from "~/client";
import type { ConferencesCreateConferenceData, ConferencesCreateConferenceResponses, ConferencesUpdateConferenceData } from "~/client";


export async function clientAction({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const updates = Object.fromEntries(formData) as Record<string, string | null>;
  // For fields other than name, set to null if empty
  Object.keys(updates).forEach((field) => {
    if (field !== "name" && updates[field] === "") {
      updates[field] = null;
    }
  });

  await conferencesCreateConference({
    body: updates as ConferencesCreateConferenceData["body"],
  });
  return redirect(`/conferences`);
}

export default function CreateConference() {
  const navigate = useNavigate();
  return (
    <Form id="new-conference-form" method="post">
      <div>
        <Label htmlFor="name">Conference Name</Label>
        <Input id="name" name="name" type="text" placeholder="Conference Name" />
      </div>
      <div>
        <Label htmlFor="start-date">Start Date</Label>
        <Input id="start-date" name="start_date" type="date" placeholder="YYYY-MM-DD" />
      </div>
      <div>
        <Label htmlFor="end-date">End Date</Label>
        <Input id="end-date" name="end_date" type="date" placeholder="YYYY-MM-DD" />
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" type="text" placeholder="Location" />
      </div>
      <div>
        <Label htmlFor="website-url">Website URL</Label>
        <Input id="website-url" name="website_url" type="url" placeholder="https://example.com" />
      </div>
      <div>
        <Label htmlFor="abstract-deadline">Abstract Deadline</Label>
        <Input id="abstract-deadline" name="abstract_deadline" type="date" placeholder="YYYY-MM-DD" />
      </div>
      <div>
        <Label htmlFor="paper-deadline">Paper Deadline</Label>
        <Input id="paper-deadline" name="paper_deadline" type="date" placeholder="YYYY-MM-DD" />
      </div>
      <div className="flex items-center space-x-2">
        <Button type="submit">
          Create Conference
        </Button>
        <Button onClick={() => navigate(-1)} type="button" variant="outline">
          Cancel
        </Button>
      </div>
    </Form >
  )

}
