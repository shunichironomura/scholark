// Define the Conference type
export interface Conference {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  website_url: string | null;
  abstract_deadline: string | null;
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

// Define the TopicNote type
export interface TopicNote {
  id: string;
  topic_id: string;
  content: string;
  created_at: string;
}

// Define the TopicConference type
export interface TopicConference {
  id: string;
  topic_id: string;
  conference_id: string;
  paper_title: string | null;
  notes: string | null;
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

// Define the ResearchTopicDetail type (ResearchTopic with notes and linked conferences)
export interface ResearchTopicDetail extends ResearchTopic {
  notes?: TopicNote[];
  conferences?: (TopicConference & { conference: Conference })[];
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

export interface ResearchTopicsResponse extends ApiResponse<ResearchTopic[]> {
  topics: ResearchTopic[];
}

export interface ResearchTopicResponse extends ApiResponse<ResearchTopic> {
  topic: ResearchTopic;
}

export interface ResearchTopicDetailResponse extends ApiResponse<ResearchTopicDetail> {
  topic: ResearchTopicDetail;
}

export interface TopicNotesResponse extends ApiResponse<TopicNote[]> {
  notes: TopicNote[];
}

export interface TopicNoteResponse extends ApiResponse<TopicNote> {
  note: TopicNote;
}

export interface TopicConferencesResponse extends ApiResponse<TopicConference[]> {
  topicConferences: TopicConference[];
}

export interface TopicConferenceResponse extends ApiResponse<TopicConference> {
  topicConference: TopicConference;
}
