-- Drop existing tables if they exist
DROP TABLE IF EXISTS topic_conferences;
DROP TABLE IF EXISTS topic_notes;
DROP TABLE IF EXISTS UserConferenceLabel;
DROP TABLE IF EXISTS UserLabel;
DROP TABLE IF EXISTS UserConferencePlan;
DROP TABLE IF EXISTS research_topics;
DROP TABLE IF EXISTS conferences;
DROP TABLE IF EXISTS User;

-- Create User table
CREATE TABLE User (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  oauth_provider TEXT NOT NULL,
  oauth_provider_user_id TEXT NOT NULL,
  calendar_token TEXT
);

-- Create Conference table
CREATE TABLE conferences (
  conference_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  location TEXT,
  website_url TEXT,
  abstract_deadline TEXT,
  paper_deadline TEXT,
  created_by_user_id TEXT,
  metadata TEXT, -- metadata stored as JSON string
  FOREIGN KEY (created_by_user_id) REFERENCES User(user_id)
);

-- Create UserLabel table
CREATE TABLE UserLabel (
  label_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label_name TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES User(user_id)
);

-- Create UserConferenceLabel table
CREATE TABLE UserConferenceLabel (
  user_label_id TEXT PRIMARY KEY,
  conference_id TEXT NOT NULL,
  label_id TEXT NOT NULL,
  FOREIGN KEY (conference_id) REFERENCES conferences(conference_id),
  FOREIGN KEY (label_id) REFERENCES UserLabel(label_id)
);

-- Create ResearchTopic table
CREATE TABLE research_topics (
  topic_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  description TEXT,
  FOREIGN KEY (user_id) REFERENCES User(user_id)
);

-- Create UserConferencePlan table
CREATE TABLE UserConferencePlan (
  plan_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  conference_id TEXT NOT NULL,
  topic_id TEXT,
  paper_title TEXT,
  bibtex TEXT,
  github_link TEXT,
  submission_status TEXT,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES User(user_id),
  FOREIGN KEY (conference_id) REFERENCES conferences(conference_id),
  FOREIGN KEY (topic_id) REFERENCES research_topics(topic_id)
);

-- Keep the topic_notes table (not in DB_SCHEMA.md but might be useful)
CREATE TABLE topic_notes (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (topic_id) REFERENCES research_topics(topic_id) ON DELETE CASCADE
);

-- Insert example conference data
INSERT INTO User (user_id, name, email, oauth_provider, oauth_provider_user_id, calendar_token)
VALUES ('1', 'Example User', 'user@example.com', 'google', 'google123', 'calendar_token_123');

INSERT INTO conferences (conference_id, name, start_date, end_date, location, website_url, abstract_deadline, paper_deadline, created_by_user_id, metadata)
VALUES ('1', 'NeurIPS 2025', '2025-12-01', '2025-12-07', 'Vancouver, Canada', 'https://neurips.cc', '2025-05-01', '2025-05-15', '1', '{"additional_info": "Annual conference on neural information processing systems"}');

INSERT INTO conferences (conference_id, name, start_date, end_date, location, website_url, abstract_deadline, paper_deadline, created_by_user_id, metadata)
VALUES ('2', 'ICML 2025', '2025-07-15', '2025-07-21', 'Vienna, Austria', 'https://icml.cc', '2025-01-15', '2025-01-30', '1', '{"additional_info": "International Conference on Machine Learning"}');

INSERT INTO conferences (conference_id, name, start_date, end_date, location, website_url, abstract_deadline, paper_deadline, created_by_user_id, metadata)
VALUES ('3', 'ICLR 2026', '2026-04-10', '2026-04-16', 'Tokyo, Japan', 'https://iclr.cc', '2025-09-10', '2025-09-25', '1', '{"additional_info": "International Conference on Learning Representations"}');

-- Insert example research topics
INSERT INTO research_topics (topic_id, user_id, topic_name, description)
VALUES ('1', '1', 'Deep Learning', 'Research on neural networks, backpropagation, and deep architectures');

INSERT INTO research_topics (topic_id, user_id, topic_name, description)
VALUES ('2', '1', 'Natural Language Processing', 'Research on language models, text generation, and understanding');

INSERT INTO research_topics (topic_id, user_id, topic_name, description)
VALUES ('3', '1', 'Computer Vision', 'Research on image recognition, object detection, and visual understanding');

-- Insert example UserLabel data
INSERT INTO UserLabel (label_id, user_id, label_name)
VALUES ('1', '1', 'Important');

INSERT INTO UserLabel (label_id, user_id, label_name)
VALUES ('2', '1', 'Considering');

-- Insert example UserConferenceLabel data
INSERT INTO UserConferenceLabel (user_label_id, conference_id, label_id)
VALUES ('1', '1', '1');

INSERT INTO UserConferenceLabel (user_label_id, conference_id, label_id)
VALUES ('2', '2', '2');

-- Insert example UserConferencePlan data
INSERT INTO UserConferencePlan (plan_id, user_id, conference_id, topic_id, paper_title, bibtex, github_link, submission_status, notes)
VALUES ('1', '1', '1', '1', 'Advances in Deep Learning', '@article{user2025advances, title={Advances in Deep Learning}, author={User, Example}, year={2025}}', 'https://github.com/example/deep-learning-paper', 'In Progress', 'Working on the methodology section');

INSERT INTO UserConferencePlan (plan_id, user_id, conference_id, topic_id, paper_title, bibtex, github_link, submission_status, notes)
VALUES ('2', '1', '2', '2', 'Novel NLP Approaches', '@article{user2025novel, title={Novel NLP Approaches}, author={User, Example}, year={2025}}', 'https://github.com/example/nlp-paper', 'Planning', 'Need to finalize the research question');
