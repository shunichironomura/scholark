import { Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { Form, redirect, useNavigate } from "react-router";
import { conferencesCreateConference } from "~/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { requireSession } from "~/lib/auth.server";
import { parseConferenceForm } from "~/lib/conference-form";
import type { Route } from "./+types/create-conference";

export async function action({ request }: Route.ActionArgs) {
  const { authHeaders } = await requireSession(request);

  const formData = await request.formData();
  const requestBody = parseConferenceForm(formData);

  await conferencesCreateConference({
    body: requestBody,
    headers: authHeaders,
  });
  return redirect(`/conferences`);
}

export default function CreateConference() {
  const navigate = useNavigate();
  // Generate unique IDs for form fields
  const formId = useId();
  const nameId = useId();
  const startDateId = useId();
  const endDateId = useId();
  const locationId = useId();
  const websiteUrlId = useId();
  // Milestones
  const [milestones, setMilestones] = useState<number[]>([]);

  const addMilestone = () => {
    // Add a new milestone index which is one greater than the current max or 0 if empty
    setMilestones((prev) => [...prev, prev.length > 0 ? Math.max(...prev) + 1 : 0]);
  };

  const removeMilestone = (indexToRemove: number) => {
    // Here, `index` means the index of the milestone in the array, not the index in the form
    setMilestones((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  return (
    <Form id={formId} method="post">
      <div className="max-w-2xl mx-auto space-y-6">
        <p className="text-sm text-yellow-600 mb-4">
          Conferences you create here will be shared and visible to all users.
          <br />
          Only admins can delete a conference after it is created.
        </p>
        <div className="space-y-1">
          <Label htmlFor={nameId}>Conference Name</Label>
          <Input
            id={nameId}
            name="name"
            type="text"
            placeholder="Conference Name"
            defaultValue="New Conference"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={startDateId}>Start Date</Label>
          <Input id={startDateId} name="start_date" type="date" placeholder="YYYY-MM-DD" />
        </div>
        <div className="space-y-1">
          <Label htmlFor={endDateId}>End Date</Label>
          <Input id={endDateId} name="end_date" type="date" placeholder="YYYY-MM-DD" />
        </div>
        <div className="space-y-1">
          <Label htmlFor={locationId}>Location</Label>
          <Input id={locationId} name="location" type="text" placeholder="Location" />
        </div>
        <div className="space-y-1">
          <Label htmlFor={websiteUrlId}>Website URL</Label>
          <Input
            id={websiteUrlId}
            name="website_url"
            type="url"
            placeholder="https://example.com"
          />
        </div>
        <div></div>
        {milestones.map((milestoneIndex, index) => (
          <div key={milestoneIndex} className="flex flex-row space-x-4 items-end">
            <div className="flex flex-col flex-3 space-y-1">
              <Label htmlFor={`milestone_name__${milestoneIndex}`}>Milestone Name</Label>
              <Input
                id={`milestone_name__${milestoneIndex}`}
                name={`milestone_name__${milestoneIndex}`}
                type="text"
                placeholder="Milestone Name"
              />
            </div>
            <div className="flex flex-col flex-2 space-y-1">
              <Label htmlFor={`milestone_date__${milestoneIndex}`}>Milestone Date</Label>
              <Input
                id={`milestone_date__${milestoneIndex}`}
                name={`milestone_date__${milestoneIndex}`}
                type="date"
                placeholder="YYYY-MM-DD"
              />
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => removeMilestone(index)}
              aria-label="Remove milestone"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <div className="flex items-center space-x-2">
          <Button type="button" onClick={addMilestone}>
            Add Milestone
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button type="submit">Create Conference</Button>
          <Button onClick={() => navigate(-1)} type="button" variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </Form>
  );
}
