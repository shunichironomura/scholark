import type { ConferenceMilestoneUpdate, ConferenceUpdate } from "~/client";

/**
 * Parse the create/edit conference form into a conference payload.
 *
 * Empty optional fields become null; milestone rows are collected from the
 * indexed milestone_name__N / milestone_date__N / milestone_time__N inputs,
 * skipping rows where name or date is missing. Rows carrying a
 * milestone_id__N (existing milestones in the edit form) keep their id so
 * the server updates them in place instead of recreating them.
 */
export function parseConferenceForm(formData: FormData): ConferenceUpdate {
  const updates = Object.fromEntries(formData) as Record<string, string | null>;
  // For fields other than name, set to null if empty
  Object.keys(updates).forEach((field) => {
    if (field !== "name" && updates[field] === "") {
      updates[field] = null;
    }
  });

  const milestoneIndices = Object.keys(updates)
    .filter((key) => key.startsWith("milestone_name__"))
    .map((key) => parseInt(key.split("__")[1], 10))
    .filter((index) => updates[`milestone_name__${index}`] && updates[`milestone_date__${index}`]);

  const milestones: ConferenceMilestoneUpdate[] = milestoneIndices
    .map((index): ConferenceMilestoneUpdate | null => {
      const name = updates[`milestone_name__${index}`];
      const date = updates[`milestone_date__${index}`];
      if (name == null || date == null) {
        return null;
      }
      return {
        id: updates[`milestone_id__${index}`] ?? undefined,
        name,
        date,
        time: updates[`milestone_time__${index}`] ?? null,
      };
    })
    .filter((milestone): milestone is ConferenceMilestoneUpdate => milestone !== null);

  return {
    name: updates.name ?? "New Conference",
    start_date: updates.start_date,
    end_date: updates.end_date,
    location: updates.location,
    website_url: updates.website_url,
    milestones: milestones,
  };
}
