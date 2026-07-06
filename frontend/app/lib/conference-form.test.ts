import { describe, expect, test } from "vite-plus/test";
import { parseConferenceForm } from "./conference-form";

function makeFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.append(key, value);
  }
  return formData;
}

describe("parseConferenceForm", () => {
  test("nulls empty optional fields but keeps the name", () => {
    const parsed = parseConferenceForm(
      makeFormData({
        name: "ISTS 2027",
        start_date: "",
        end_date: "2027-06-05",
        location: "",
        website_url: "",
      }),
    );
    expect(parsed.name).toBe("ISTS 2027");
    expect(parsed.start_date).toBeNull();
    expect(parsed.end_date).toBe("2027-06-05");
    expect(parsed.location).toBeNull();
    expect(parsed.website_url).toBeNull();
    expect(parsed.milestones).toEqual([]);
  });

  test("collects milestone rows with id and time", () => {
    const parsed = parseConferenceForm(
      makeFormData({
        name: "ISTS 2027",
        milestone_id__0: "11111111-1111-1111-1111-111111111111",
        milestone_name__0: "Abstract deadline",
        milestone_date__0: "2027-01-15",
        milestone_time__0: "12:00",
        milestone_id__2: "",
        milestone_name__2: "Camera-ready",
        milestone_date__2: "2027-03-01",
        milestone_time__2: "",
      }),
    );
    expect(parsed.milestones).toEqual([
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Abstract deadline",
        date: "2027-01-15",
        time: "12:00",
      },
      // New rows have no id; a cleared time is sent as null.
      { id: undefined, name: "Camera-ready", date: "2027-03-01", time: null },
    ]);
  });

  test("skips milestone rows missing a name or date", () => {
    const parsed = parseConferenceForm(
      makeFormData({
        name: "ISTS 2027",
        milestone_name__0: "Incomplete",
        milestone_date__0: "",
        milestone_name__1: "",
        milestone_date__1: "2027-01-15",
      }),
    );
    expect(parsed.milestones).toEqual([]);
  });
});
