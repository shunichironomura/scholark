import { pgTable, text, jsonb, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// User table
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  oauthProvider: text('oauth_provider').notNull(),
  oauthProviderUserId: text('oauth_provider_user_id').notNull(),
  calendarToken: text('calendar_token'),
});

// Conference table
export const conference = pgTable('conference', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  startDate: text('start_date'),
  endDate: text('end_date'),
  location: text('location'),
  websiteUrl: text('website_url'),
  abstractDeadline: text('abstract_deadline'),
  paperDeadline: text('paper_deadline'),
  createdByUserId: text('created_by_user_id').references(() => user.id),
  metadata: jsonb('metadata'), // Using JSONB for metadata
});

// UserLabel table
export const userLabel = pgTable('user_label', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  labelName: text('label_name').notNull(),
});

// UserConferenceLabel table
export const userConferenceLabel = pgTable('user_conference_label', {
  id: text('id').primaryKey(),
  conferenceId: text('conference_id').notNull().references(() => conference.id),
  labelId: text('label_id').notNull().references(() => userLabel.id),
});

// ResearchTopic table
export const researchTopic = pgTable('research_topic', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  topicName: text('topic_name').notNull(),
  description: text('description'),
});

// UserConferencePlan table
export const userConferencePlan = pgTable('user_conference_plan', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  conferenceId: text('conference_id').notNull().references(() => conference.id),
  topicId: text('topic_id').references(() => researchTopic.id),
  paperTitle: text('paper_title'),
  bibtex: text('bibtex'),
  githubLink: text('github_link'),
  submissionStatus: text('submission_status'),
  notes: text('notes'),
});

// TopicNote table
export const topicNote = pgTable('topic_note', {
  id: text('id').primaryKey(),
  topicId: text('topic_id').notNull().references(() => researchTopic.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
});

// Define relations
export const userRelations = relations(user, ({ many }) => ({
  conferences: many(conference),
  labels: many(userLabel),
  researchTopics: many(researchTopic),
  conferencePlans: many(userConferencePlan),
}));

export const conferenceRelations = relations(conference, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [conference.createdByUserId],
    references: [user.id],
  }),
  labels: many(userConferenceLabel),
  plans: many(userConferencePlan),
}));

export const researchTopicRelations = relations(researchTopic, ({ one, many }) => ({
  user: one(user, {
    fields: [researchTopic.userId],
    references: [user.id],
  }),
  notes: many(topicNote),
  conferencePlans: many(userConferencePlan),
}));

export const userLabelRelations = relations(userLabel, ({ one, many }) => ({
  user: one(user, {
    fields: [userLabel.userId],
    references: [user.id],
  }),
  conferenceLabels: many(userConferenceLabel),
}));

export const userConferenceLabelRelations = relations(userConferenceLabel, ({ one }) => ({
  conference: one(conference, {
    fields: [userConferenceLabel.conferenceId],
    references: [conference.id],
  }),
  label: one(userLabel, {
    fields: [userConferenceLabel.labelId],
    references: [userLabel.id],
  }),
}));

export const userConferencePlanRelations = relations(userConferencePlan, ({ one }) => ({
  user: one(user, {
    fields: [userConferencePlan.userId],
    references: [user.id],
  }),
  conference: one(conference, {
    fields: [userConferencePlan.conferenceId],
    references: [conference.id],
  }),
  topic: one(researchTopic, {
    fields: [userConferencePlan.topicId],
    references: [researchTopic.id],
  }),
}));

export const topicNoteRelations = relations(topicNote, ({ one }) => ({
  topic: one(researchTopic, {
    fields: [topicNote.topicId],
    references: [researchTopic.id],
  }),
}));
