import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import type { Route } from "./+types/timeline"
import { conferencesReadConferences, conferencesCreateConference } from '~/client';
import type { ConferencePublicReadable, ConferenceCreate } from "~/client";
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
import { getSession } from "~/sessions.server";
import { Badge } from "~/components/ui/badge"
import { pickLabelTextColor } from "~/lib/color";
// Define the schedule item interface
interface Tag {
  name: string;
  color: string;
}
interface ScheduleItem {
  date: Date;
  type: 'conference_start' | 'conference_end' | 'milestone';
  title: string;
  tags: Tag[];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("accessToken")) {
    return redirect("/login");
  }
  const token = session.get("accessToken");

  const { data: conferences, error } = await conferencesReadConferences({
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) {
    throw new Response("Error fetching conferences", { status: 500 });
  }
  return { conferences };
}

export default function Timeline({ loaderData }: Route.ComponentProps) {
  const { conferences } = loaderData;
  const scheduleItems: ScheduleItem[] = [];
  const formatDate = (date: Date) => {
    const dateString = date.toISOString().slice(0, 10) // Format as YYYY-MM-DD

    const today = new Date();

    date.setHours(0, 0, 0, 0); // Set time to midnight for comparison
    today.setHours(0, 0, 0, 0); // Set time to midnight for comparison
    const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 3600 * 24));

    const diffDaysText = diffDays === 0 ? "Today" : `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ${diffDays > 0 ? 'from now' : 'ago'}`;
    return `${dateString} (${diffDaysText})`;
  }
  // Helper function to get month and year from date
  const getYearMonth = (date: Date): string => {
    return date.toISOString().slice(0, 7); // Format as YYYY-MM
  };
  conferences.data.forEach((conference) => {
    const conferenceTags = conference.tags ?? [];

    if (conference.start_date) {
      scheduleItems.push({
        date: new Date(conference.start_date),
        type: 'conference_start',
        title: `${conference.name} – Start`,
        tags: conferenceTags,
      });
    }
    if (conference.end_date) {
      scheduleItems.push({
        date: new Date(conference.end_date),
        type: 'conference_end',
        title: `${conference.name} – End`,
        tags: conferenceTags,
      });
    }
    if (conference.milestones) {
      conference.milestones.forEach((milestone) => {
        if (milestone.date) {
          scheduleItems.push({
            date: new Date(milestone.date),
            type: 'milestone',
            title: `${conference.name} – ${milestone.name}`,
            tags: conferenceTags,
          });
        }
      });
    }
  })

  // Sort schedule items by date
  scheduleItems.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Group schedule items by month
  const groupedScheduleItems: Record<string, ScheduleItem[]> = {};
  scheduleItems.forEach((item) => {
    const yearMonth = getYearMonth(item.date);
    if (!groupedScheduleItems[yearMonth]) {
      groupedScheduleItems[yearMonth] = [];
    }
    groupedScheduleItems[yearMonth].push(item);
  });

  const icon = (scheduleItemType: string) => {
    switch (scheduleItemType) {
      case 'conference_start':
        return "🎯 ";
      case 'conference_end':
        return "🏁 ";
      case 'milestone':
        return "📅 ";
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(groupedScheduleItems).map(([yearMonth, items]) => (
        <div key={yearMonth} className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">{yearMonth}</h2>
          {items.map((item, index) => (
            <Card key={index} className="bg-white shadow-md">
              <CardHeader>
                <CardTitle>{icon(item.type)}{item.title}</CardTitle>
                <CardDescription>
                  <Calendar className="inline mr-1" />
                  {formatDate(item.date)}
                </CardDescription>
                <CardFooter className="flex gap-1">
                  {item.tags.map((tag, index) => (
                    <Badge key={index} style={{ color: pickLabelTextColor(tag.color), backgroundColor: tag.color }} className="text-blue-700">
                      {tag.name}
                    </Badge>
                  ))}
                </CardFooter>
              </CardHeader>
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}
