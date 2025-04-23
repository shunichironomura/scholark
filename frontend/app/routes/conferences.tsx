import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import type { Route } from "./+types/conferences"
import { conferencesReadConferences, conferencesCreateConference } from '~/client';
import type { ConferencePublic, ConferenceCreate } from "~/client";
import { MapPin, Calendar, Plus, Trash2, Pencil } from "lucide-react";
import { Form, redirect } from "react-router";

export async function clientLoader({ }: Route.ClientLoaderArgs) {
  const { data, error } = await conferencesReadConferences();
  if (error) {
    throw new Response("Error fetching conferences", { status: 500 });
  }
  return { data };
}

export default function Conferences({
  loaderData,
}: Route.ComponentProps) {
  const { data: conferences } = loaderData;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toISOString().slice(0, 10) // Format as YYYY-MM-DD
  }

  // Determine deadline status for styling
  const getDeadlineStatus = (deadlineString?: string | null) => {
    if (!deadlineString) return '';

    const deadline = new Date(deadlineString);
    const today = new Date();

    // Reset time part for accurate day calculation
    deadline.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'text-zinc-500'; // Past deadline
    } else if (diffDays <= 7) {
      return 'text-red-500 font-bold'; // Urgent (within a week)
    } else if (diffDays <= 30) {
      return 'text-orange-500'; // Approaching (within a month)
    } else {
      return 'text-green-500'; // Plenty of time
    }
  };

  const formatDateRange = (start?: string | null, end?: string | null) => {
    const s = start ? formatDate(start) : '';
    const e = end ? formatDate(end) : '';

    if (s && e) return `${s} – ${e}`;   // both present
    if (s) return `${s} –`;       // only start
    if (e) return `– ${e}`;       // only end
    return '';                           // neither
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-svh p-4">
      <div className="flex justify-between items-center mb-6 space-x-3">
        <h1 className="text-3xl font-bold text-zinc-900">Conferences</h1>
        <Form action="new">
          <Button type="submit" variant="outline">
            <Plus /> Add Conference
          </Button>
        </Form>
      </div>

      {conferences && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conferences.data.map((conference: ConferencePublic) => (
            <Card className="w-[300px] flex flex-col space-y-2">
              <CardHeader className="flex-none space-y-1">
                <CardTitle>{conference.name}</CardTitle>
                <CardDescription>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 shrink-0" area-hidden="true" />
                      {conference.location}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 shrink-0" area-hidden="true" />
                      {formatDateRange(conference.start_date, conference.end_date)}
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="font-medium">Deadlines</div>
                <div className={`${getDeadlineStatus(conference.abstract_deadline)} text-sm`}>Abstract Deadline: {formatDate(conference.abstract_deadline)}</div>
                <div className={`${getDeadlineStatus(conference.paper_deadline)} text-sm`}>Paper Deadline: {formatDate(conference.paper_deadline)}</div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                {conference.website_url ? (
                  <a href={conference.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm mt-auto">
                    Visit Website
                  </a>
                ) : <div />}
                <div className="flex space-x-2">
                  <Form
                    action={`${conference.id}/edit`}
                  >
                    <Button type="submit" variant="secondary" size="icon">
                      <Pencil />
                    </Button>
                  </Form>
                  <Form
                    action={`${conference.id}/delete`}
                    method="post"
                    onSubmit={(event) => {
                      const response = confirm("Are you sure you want to delete this conference?");
                      if (!response) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <Button type="submit" variant="destructive" size="icon">
                      <Trash2 />
                    </Button>
                  </Form>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )
      }
    </div >
  );
}
