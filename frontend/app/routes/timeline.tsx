import { Calendar } from "lucide-react";
import { data, redirect, useSearchParams } from "react-router";
import { conferencesReadConferences, tagsReadTags } from "~/client";
import { Badge } from "~/components/ui/badge";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { pickLabelTextColor } from "~/lib/color";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/timeline";

// Define the schedule item interface
interface Tag {
  name: string;
  color: string;
}
interface ScheduleItem {
  date: Date;
  type: "conference_start" | "conference_end" | "milestone";
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

  const { data: userTags, error: userTagsError } = await tagsReadTags({
    headers: { Authorization: `Bearer ${session.get("accessToken")}` },
  });
  if (userTagsError || !userTags) {
    throw data("User tags not found", { status: 404 });
  }

  // const formData = await request.formData();
  // const selectedTagId = formData.get("selectedTagId") as string | null;
  return { conferences, userTags };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("accessToken")) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const _selectedTagId = formData.get("selectedTagId") as string | null;
}

export default function Timeline({ loaderData }: Route.ComponentProps) {
  const { conferences, userTags } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTagId = searchParams.get("selectedTagId") ?? "_all";

  const scheduleItems: ScheduleItem[] = [];
  const formatDate = (date: Date) => {
    const dateString = date.toISOString().slice(0, 10); // Format as YYYY-MM-DD

    const today = new Date();

    date.setHours(0, 0, 0, 0); // Set time to midnight for comparison
    today.setHours(0, 0, 0, 0); // Set time to midnight for comparison
    const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 3600 * 24));

    const diffDaysText =
      diffDays === 0
        ? "Today"
        : `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""} ${diffDays > 0 ? "from now" : "ago"}`;
    return `${dateString} (${diffDaysText})`;
  };
  // Helper function to get month and year from date
  const getYearMonth = (date: Date): string => {
    return date.toISOString().slice(0, 7); // Format as YYYY-MM
  };
  conferences.data.forEach((conference) => {
    const conferenceTags = conference.tags ?? [];

    if (selectedTagId === "_all" || conferenceTags.some((tag) => tag.id === selectedTagId)) {
      if (conference.start_date) {
        scheduleItems.push({
          date: new Date(conference.start_date),
          type: "conference_start",
          title: `${conference.name} – Start`,
          tags: conferenceTags,
        });
      }
      if (conference.end_date) {
        scheduleItems.push({
          date: new Date(conference.end_date),
          type: "conference_end",
          title: `${conference.name} – End`,
          tags: conferenceTags,
        });
      }
      if (conference.milestones) {
        conference.milestones.forEach((milestone) => {
          if (milestone.date) {
            scheduleItems.push({
              date: new Date(milestone.date),
              type: "milestone",
              title: `${conference.name} – ${milestone.name}`,
              tags: conferenceTags,
            });
          }
        });
      }
    }
  });

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
      case "conference_start":
        return "🎯 ";
      case "conference_end":
        return "🏁 ";
      case "milestone":
        return "📅 ";
      default:
        return null;
    }
  };

  const tagComponent = (tag: Tag) => (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
      style={{
        backgroundColor: tag.color,
        color: pickLabelTextColor(tag.color),
      }}
    >
      {tag.name}
    </span>
  );

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-center">Timeline</h1>
      <div className="p-4 flex justify-end space-x-2 items-center">
        <Label>Filter by tag</Label>
        <Select
          defaultValue={searchParams.get("selectedTagId") ?? "_all"}
          onValueChange={(selectedTagId) => {
            setSearchParams({ selectedTagId });
          }}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Tags</SelectLabel>
              <SelectItem value="_all">All tags</SelectItem>
              {userTags.data.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tagComponent(tag)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-4">
        {Object.entries(groupedScheduleItems).map(([yearMonth, items]) => {
          const isAllPast = items.every((item) => item.date < new Date());
          return (
            <div key={yearMonth} className="flex flex-col gap-2">
              <h2 className={`text-2xl font-bold ${isAllPast ? "opacity-50" : ""}`}>{yearMonth}</h2>
              {items.map((item) => {
                const isPast = item.date < new Date();
                return (
                  <Card
                    key={`${item.type}-${item.title}-${item.date.toISOString()}`}
                    className={`bg-white shadow-md ${isPast ? "opacity-50" : ""}`}
                  >
                    <CardHeader>
                      <CardTitle>
                        {icon(item.type)}
                        {item.title}
                      </CardTitle>
                      <CardDescription>
                        <Calendar className="inline mr-1" />
                        {formatDate(item.date)}
                      </CardDescription>
                      <CardFooter className="flex gap-1">
                        {item.tags.map((tag) => (
                          <Badge
                            key={tag.name}
                            style={{
                              color: pickLabelTextColor(tag.color),
                              backgroundColor: tag.color,
                            }}
                            className="text-blue-700"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </CardFooter>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}
