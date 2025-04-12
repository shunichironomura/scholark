-- Drop existing tables if they exist
DROP TABLE IF EXISTS topic_note;
DROP TABLE IF EXISTS user_conference_plan;
DROP TABLE IF EXISTS research_topic;
DROP TABLE IF EXISTS user_conference_label;
DROP TABLE IF EXISTS user_label;
DROP TABLE IF EXISTS conference;
DROP TABLE IF EXISTS whitelist;
DROP TABLE IF EXISTS user;

-- Create whitelist table for private beta
CREATE TABLE whitelist (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  added_at TEXT NOT NULL,
  added_by TEXT
);

-- Create user table
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  oauth_provider TEXT NOT NULL,
  oauth_provider_user_id TEXT NOT NULL,
  calendar_token TEXT
);

-- Create Conference table
CREATE TABLE conference (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  location TEXT,
  website_url TEXT,
  abstract_deadline TEXT,
  paper_deadline TEXT,
  created_by_user_id TEXT,
  metadata TEXT, -- metadata stored as JSON string
  FOREIGN KEY (created_by_user_id) REFERENCES user(id)
);

-- Create user_label table
CREATE TABLE user_label (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label_name TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id)
);

-- Create user_conference_label table
CREATE TABLE user_conference_label (
  id TEXT PRIMARY KEY,
  conference_id TEXT NOT NULL,
  label_id TEXT NOT NULL,
  FOREIGN KEY (conference_id) REFERENCES conference(id),
  FOREIGN KEY (label_id) REFERENCES user_label(id)
);

-- Create ResearchTopic table
CREATE TABLE research_topic (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  description TEXT,
  FOREIGN KEY (user_id) REFERENCES user(id)
);

-- Create user_conference_plan table
CREATE TABLE user_conference_plan (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  conference_id TEXT NOT NULL,
  topic_id TEXT,
  paper_title TEXT,
  bibtex TEXT,
  github_link TEXT,
  submission_status TEXT,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (conference_id) REFERENCES conference(id),
  FOREIGN KEY (topic_id) REFERENCES research_topic(id)
);

-- Keep the topic_note table (not in DB_SCHEMA.md but might be useful)
CREATE TABLE topic_note (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (topic_id) REFERENCES research_topic(id) ON DELETE CASCADE
);

-- Insert example conference data
INSERT INTO user (id, name, email, oauth_provider, oauth_provider_user_id, calendar_token)
VALUES ('1', 'Example user', 'user@example.com', 'google', 'google123', 'calendar_token_123');

INSERT INTO conference (id, name, start_date, end_date, location, website_url, abstract_deadline, paper_deadline, created_by_user_id, metadata)
VALUES ('1', 'NeurIPS 2025', '2025-12-01', '2025-12-07', 'Vancouver, Canada', 'https://neurips.cc', '2025-05-01', '2025-05-15', '1', '{"additional_info": "Annual conference on neural information processing systems"}');

INSERT INTO conference (id, name, start_date, end_date, location, website_url, abstract_deadline, paper_deadline, created_by_user_id, metadata)
VALUES ('2', 'ICML 2025', '2025-07-15', '2025-07-21', 'Vienna, Austria', 'https://icml.cc', '2025-01-15', '2025-01-30', '1', '{"additional_info": "International Conference on Machine Learning"}');

INSERT INTO conference (id, name, start_date, end_date, location, website_url, abstract_deadline, paper_deadline, created_by_user_id, metadata)
VALUES ('3', 'ICLR 2026', '2026-04-10', '2026-04-16', 'Tokyo, Japan', 'https://iclr.cc', '2025-09-10', '2025-09-25', '1', '{"additional_info": "International Conference on Learning Representations"}');

-- Insert example research topics
INSERT INTO research_topic (id, user_id, topic_name, description)
VALUES ('1', '1', 'Deep Learning', 'Research on neural networks, backpropagation, and deep architectures');

INSERT INTO research_topic (id, user_id, topic_name, description)
VALUES ('2', '1', 'Natural Language Processing', 'Research on language models, text generation, and understanding');

INSERT INTO research_topic (id, user_id, topic_name, description)
VALUES ('3', '1', 'Computer Vision', 'Research on image recognition, object detection, and visual understanding');

-- Insert example user_label data
INSERT INTO user_label (id, user_id, label_name)
VALUES ('1', '1', 'Important');

INSERT INTO user_label (id, user_id, label_name)
VALUES ('2', '1', 'Considering');

-- Insert example user_conference_label data
INSERT INTO user_conference_label (id, conference_id, label_id)
VALUES ('1', '1', '1');

INSERT INTO user_conference_label (id, conference_id, label_id)
VALUES ('2', '2', '2');

-- Insert example user_conference_plan data
INSERT INTO user_conference_plan (id, user_id, conference_id, topic_id, paper_title, bibtex, github_link, submission_status, notes)
VALUES ('1', '1', '1', '1', 'Advances in Deep Learning', '@article{user2025advances, title={Advances in Deep Learning}, author={user, Example}, year={2025}}', 'https://github.com/example/deep-learning-paper', 'In Progress', 'Working on the methodology section');

INSERT INTO user_conference_plan (id, user_id, conference_id, topic_id, paper_title, bibtex, github_link, submission_status, notes)
VALUES ('2', '1', '2', '2', 'Novel NLP Approaches', '@article{user2025novel, title={Novel NLP Approaches}, author={user, Example}, year={2025}}', 'https://github.com/example/nlp-paper', 'Planning', 'Need to finalize the research question');

-- Insert example whitelist entries for private beta
INSERT INTO whitelist (id, email, added_at, added_by)
VALUES ('1', 'user@example.com', '2025-04-01T00:00:00Z', 'admin');

INSERT INTO whitelist (id, email, added_at, added_by)
VALUES ('2', 'researcher@university.edu', '2025-04-01T00:00:00Z', 'admin');

INSERT INTO whitelist (id, email, added_at, added_by)
VALUES ('3', 'scientist@research.org', '2025-04-01T00:00:00Z', 'admin');
