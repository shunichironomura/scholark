import { z } from "zod";

// User and Authentication Schemas
export const UserSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  oauth_provider: z.string(),
  oauth_provider_user_id: z.string(),
  calendar_token: z.string().nullable(),
});

export const WhitelistSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  added_at: z.string().optional(),
  added_by: z.string().optional(),
});

export const AuthResponseSchema = z.object({
  success: z.boolean(),
  user: UserSchema.optional(),
  error: z.string().optional(),
  token: z.string().optional(),
});

export const ConferenceSchema = z.object({
  id: z.string().optional(), // Make id optional for creation
  name: z.string(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  location: z.string().nullable(),
  website_url: z.string().nullable(),
  abstract_deadline: z.string().nullable(),
  paper_deadline: z.string().nullable(),
  metadata: z.record(z.any()).nullable(),
  user_id: z.string().optional(), // Make user_id optional for creation
});

export const UserLabelSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const ResearchTopicSchema = z.object({
  id: z.string().optional(), // Make id optional for creation
  name: z.string(),
  topic_name: z.string().optional(), // Add optional topic_name property for database compatibility
  description: z.string().nullable(),
  user_id: z.string().optional(), // Make user_id optional for creation
});

export const TopicNoteSchema = z.object({
  id: z.string(),
  topic_id: z.string(),
  content: z.string(),
  created_at: z.string(),
});

export const UserConferencePlanSchema = z.object({
  id: z.string(),
  conference_id: z.string(),
  topic_id: z.string().nullable(),
  paper_title: z.string().nullable(),
  bibtex: z.string().nullable(),
  github_link: z.string().nullable(),
  submission_status: z.string(),
  notes: z.string().nullable(),
});

export const UserConferenceLabelSchema = z.object({
  id: z.string(),
  conference_id: z.string(),
  label_id: z.string(),
});

// Generic API response schema
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
}).catchall(z.any());

// Specific response schemas
export const ConferencesResponseSchema = ApiResponseSchema.extend({
  conferences: z.array(ConferenceSchema),
});
export const ConferenceResponseSchema = ApiResponseSchema.extend({
  conference: ConferenceSchema,
});
export const ResearchTopicsResponseSchema = ApiResponseSchema.extend({
  topics: z.array(ResearchTopicSchema),
});
export const ResearchTopicResponseSchema = ApiResponseSchema.extend({
  topic: ResearchTopicSchema,
});
export const TopicNotesResponseSchema = ApiResponseSchema.extend({
  notes: z.array(TopicNoteSchema),
});
export const TopicNoteResponseSchema = ApiResponseSchema.extend({
  note: TopicNoteSchema,
});

// Export inferred types
export type User = z.infer<typeof UserSchema>;
export type Whitelist = z.infer<typeof WhitelistSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type Conference = z.infer<typeof ConferenceSchema>;
export type UserLabel = z.infer<typeof UserLabelSchema>;
export type ResearchTopic = z.infer<typeof ResearchTopicSchema>;
export type TopicNote = z.infer<typeof TopicNoteSchema>;
export type UserConferencePlan = z.infer<typeof UserConferencePlanSchema>;

export type ConferencesResponse = z.infer<typeof ConferencesResponseSchema>;
export type ConferenceResponse = z.infer<typeof ConferenceResponseSchema>;
export type ResearchTopicsResponse = z.infer<typeof ResearchTopicsResponseSchema>;
export type ResearchTopicResponse = z.infer<typeof ResearchTopicResponseSchema>;
export type TopicNotesResponse = z.infer<typeof TopicNotesResponseSchema>;
export type TopicNoteResponse = z.infer<typeof TopicNoteResponseSchema>;
