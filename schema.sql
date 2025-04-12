CREATE TABLE IF NOT EXISTS conferences (
  id TEXT PRIMARY KEY, -- store UUID here
  name TEXT NOT NULL,
  start_date TEXT,
  paper_deadline TEXT,
  metadata TEXT -- metadata stored as JSON string
);

-- Insert example conference data
INSERT INTO conferences (id, name, start_date, paper_deadline, metadata)
VALUES ('1', 'NeurIPS 2025', '2025-12-01', '2025-05-15', '{"location": "Vancouver, Canada", "website": "https://neurips.cc"}');

INSERT INTO conferences (id, name, start_date, paper_deadline, metadata)
VALUES ('2', 'ICML 2025', '2025-07-15', '2025-01-30', '{"location": "Vienna, Austria", "website": "https://icml.cc"}');

INSERT INTO conferences (id, name, start_date, paper_deadline, metadata)
VALUES ('3', 'ICLR 2026', '2026-04-10', '2025-09-25', '{"location": "Tokyo, Japan", "website": "https://iclr.cc"}');
