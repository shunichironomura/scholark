-- Drop existing tables if they exist
DROP TABLE IF EXISTS conferences;
DROP TABLE IF EXISTS research_topics;

-- Create tables
CREATE TABLE conferences (
  id TEXT PRIMARY KEY, -- store UUID here
  name TEXT NOT NULL,
  start_date TEXT,
  paper_deadline TEXT,
  metadata TEXT -- metadata stored as JSON string
);

CREATE TABLE research_topics (
  id TEXT PRIMARY KEY, -- store UUID here
  name TEXT NOT NULL,
  description TEXT
);

-- Insert example conference data
INSERT INTO conferences (id, name, start_date, paper_deadline, metadata)
VALUES ('1', 'NeurIPS 2025', '2025-12-01', '2025-05-15', '{"location": "Vancouver, Canada", "website": "https://neurips.cc"}');

INSERT INTO conferences (id, name, start_date, paper_deadline, metadata)
VALUES ('2', 'ICML 2025', '2025-07-15', '2025-01-30', '{"location": "Vienna, Austria", "website": "https://icml.cc"}');

INSERT INTO conferences (id, name, start_date, paper_deadline, metadata)
VALUES ('3', 'ICLR 2026', '2026-04-10', '2025-09-25', '{"location": "Tokyo, Japan", "website": "https://iclr.cc"}');

-- Insert example research topics
INSERT INTO research_topics (id, name, description)
VALUES ('1', 'Deep Learning', 'Research on neural networks, backpropagation, and deep architectures');

INSERT INTO research_topics (id, name, description)
VALUES ('2', 'Natural Language Processing', 'Research on language models, text generation, and understanding');

INSERT INTO research_topics (id, name, description)
VALUES ('3', 'Computer Vision', 'Research on image recognition, object detection, and visual understanding');
