import type { ConferenceCreate, ConferenceMilestoneCreate } from "~/client";

/**
 * Parse the create/edit conference form into a conference payload.
 *
 * Empty optional fields become null; milestone rows are collected from the
 * indexed milestone_name__N / milestone_date__N inputs, skipping rows where
 * either value is missing.
 */
export function parseConferenceForm(formData: FormData): ConferenceCreate {
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

  return {
    name: updates.name ?? "New Conference",
    start_date: updates.start_date,
    end_date: updates.end_date,
    location: updates.location,
    website_url: updates.website_url,
    milestones: milestones,
  };
}
