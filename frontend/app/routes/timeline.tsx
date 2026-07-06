import { Calendar } from "lucide-react";
import { data, useSearchParams } from "react-router";
import { conferencesReadConferences, tagsReadTags } from "~/client";
import { Badge } from "~/components/ui/badge";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { logoutIfUnauthorized, requireSession } from "~/lib/auth.server";
import { pickLabelTextColor } from "~/lib/color";
import { diffCalendarDays, formatDateOnly, parseDateOnly, startOfToday } from "~/lib/date";
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
  const { session, authHeaders } = await requireSession(request);

  const {
    data: conferences,
    error,
    response,
  } = await conferencesReadConferences({
    headers: authHeaders,
  });
  if (error) {
    await logoutIfUnauthorized(session, response);
    throw data("Error fetching conferences", { status: 500 });
  }

  const {
    data: userTags,
    error: userTagsError,
    response: userTagsResponse,
  } = await tagsReadTags({
    headers: authHeaders,
  });
  if (userTagsError || !userTags) {
    await logoutIfUnauthorized(session, userTagsResponse);
    throw data("Error fetching tags", { status: 500 });
  }

  return { conferences, userTags };
}

export default function Timeline({ loaderData }: Route.ComponentProps) {
  const { conferences, userTags } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTagId = searchParams.get("selectedTagId") ?? "_all";
  const showPast = searchParams.get("showPast") === "true";

  const today = startOfToday();

  const scheduleItems: ScheduleItem[] = [];
  // Renders the item's local calendar date plus its distance from today.
  // Must not mutate its argument: it runs during render on loader data.
  const formatDate = (date: Date) => {
    const dateString = formatDateOnly(date);
    const diffDays = diffCalendarDays(date, today);

    const diffDaysText =
      diffDays === 0
        ? "Today"
        : `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""} ${diffDays > 0 ? "from now" : "ago"}`;
    return `${dateString} (${diffDaysText})`;
  };
  // Helper function to get month and year from date
  const getYearMonth = (date: Date): string => {
    return formatDateOnly(date).slice(0, 7); // Format as YYYY-MM
  };
  conferences.data.forEach((conference) => {
    const conferenceTags = conference.tags ?? [];

    if (selectedTagId === "_all" || conferenceTags.some((tag) => tag.id === selectedTagId)) {
      if (conference.start_date) {
        scheduleItems.push({
          date: parseDateOnly(conference.start_date),
          type: "conference_start",
          title: `${conference.name} – Start`,
          tags: conferenceTags,
        });
      }
      if (conference.end_date) {
        scheduleItems.push({
          date: parseDateOnly(conference.end_date),
          type: "conference_end",
          title: `${conference.name} – End`,
          tags: conferenceTags,
        });
      }
      if (conference.milestones) {
        conference.milestones.forEach((milestone) => {
          if (milestone.date) {
            scheduleItems.push({
              date: parseDateOnly(milestone.date),
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

  // Filter out past items unless showPast is enabled
  const visibleItems = showPast
    ? scheduleItems
    : scheduleItems.filter((item) => item.date >= today);

  // Group schedule items by month
  const groupedScheduleItems: Record<string, ScheduleItem[]> = {};
  visibleItems.forEach((item) => {
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
      <div className="p-4 flex justify-end space-x-4 items-center">
        <div className="flex items-center space-x-2">
          <Switch
            id="show-past"
            checked={showPast}
            onCheckedChange={(checked) => {
              setSearchParams((prev) => {
                if (checked) {
                  prev.set("showPast", "true");
                } else {
                  prev.delete("showPast");
                }
                return prev;
              });
            }}
          />
          <Label htmlFor="show-past">Show past</Label>
        </div>
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
          const isAllPast = items.every((item) => item.date < today);
          return (
            <div key={yearMonth} className="flex flex-col gap-2">
              <h2 className={`text-2xl font-bold ${isAllPast ? "opacity-50" : ""}`}>{yearMonth}</h2>
              {items.map((item) => {
                const isPast = item.date < today;
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
