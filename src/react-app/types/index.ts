// Define the Conference type
export interface Conference {
  id: string;
  name: string;
  start_date: string | null;
  paper_deadline: string | null;
  metadata: Record<string, any> | null;
}

// Define the UserLabel type
export interface UserLabel {
  id: string;
  name: string;
}

// Define the ResearchTopic type
export interface ResearchTopic {
  id: string;
  name: string;
  description: string | null;
}

// Define the UserConferencePlan type
export interface UserConferencePlan {
  id: string;
  conference_id: string;
  topic_id: string | null;
  paper_title: string | null;
  bibtex: string | null;
  github_link: string | null;
  submission_status: string;
  notes: string | null;
}

// Define the ConferenceWithLabels type (Conference with associated labels)
export interface ConferenceWithLabels extends Conference {
  labels?: UserLabel[];
  plan?: UserConferencePlan;
}

// Define the API response types
export interface ApiResponse<T> {
  success: boolean;
  error?: string;
  [key: string]: any;
}

export interface ConferencesResponse extends ApiResponse<Conference[]> {
  conferences: Conference[];
}

export interface ConferenceResponse extends ApiResponse<Conference> {
  conference: Conference;
}
