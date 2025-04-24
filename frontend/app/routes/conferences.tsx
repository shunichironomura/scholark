import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import type { Route } from "./+types/conferences"
import { conferencesReadConferences, conferencesCreateConference } from '~/client';
import type { ConferencePublic, ConferenceCreate } from "~/client";
import { MapPin, Calendar, Plus, Trash2, Pencil } from "lucide-react";
import { Form, redirect } from "react-router";
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

export async function clientLoader({ }: Route.ClientLoaderArgs) {
  const { data: conferences, error } = await conferencesReadConferences();
  if (error) {
    throw new Response("Error fetching conferences", { status: 500 });
  }
  // Sort conferences by start_date in ascending order
  conferences.data.sort((a: ConferencePublic, b: ConferencePublic) => {
    const dateA = new Date(a.start_date || 0);
    const dateB = new Date(b.start_date || 0);
    return dateA.getTime() - dateB.getTime();
  });
  return { conferences };
}

export default function Conferences({
  loaderData,
}: Route.ComponentProps) {
  const { conferences } = loaderData;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toISOString().slice(0, 10) // Format as YYYY-MM-DD
  }

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toISOString().slice(0, 19).replace("T", " "); // Format as YYYY-MM-DD HH:MM:SS
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
              <CardFooter className="flex flex-col space-y-2">
                <div className="flex w-full items-center justify-between">
                  {/* Left side: Website Link (takes all available space) */}
                  {conference.website_url ? (
                    <a
                      href={conference.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm mt-auto"
                    >
                      Visit Website
                    </a>
                  ) : <div />} {/* Placeholder if no link */}

                  {/* Right side: Buttons */}
                  <div className="flex space-x-2">
                    <Form action={`${conference.id}/edit`}>
                      <Button type="submit" variant="secondary" size="icon">
                        <Pencil />
                      </Button>
                    </Form>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" size="icon">
                          <Trash2 />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <Form
                          action={`${conference.id}/delete`}
                          method="post"
                        >
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this conference.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction type="submit">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </Form>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {/* Display created_at and updated_at values in small text */}
                <div className="text-xs text-gray-500 mt-2 text-right w-full">
                  Created at: {formatDateTime(conference.created_at)}
                  <br />
                  Updated at: {formatDateTime(conference.updated_at)}
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
