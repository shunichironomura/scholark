# Database Schema for Conference Management System

## User

- `user_id (PK)`
- `name`
- `email`
- `oauth_provider`
- `oauth_provider_user_id`
- `calendar_token`

## Conference

- `conference_id (PK)`
- `name`
- `start_date`
- `end_date`
- `location`
- `website_url`
- `abstract_deadline`
- `paper_deadline`
- `created_by_user_id (FK → User)`
- `metadata (JSON) ← flexible attributes`

## UserLabel

- `label_id (PK)`
- `user_id (FK → User)`
- `label_name`

## UserConferenceLabel

- `user_label_id (PK)`
- `conference_id (FK → Conference)`
- `label_id (FK → UserLabel)`

## ResearchTopic

- `topic_id (PK)`
- `user_id (FK → User)`
- `topic_name`
- `description (nullable)`

## UserConferencePlan

- `plan_id (PK)`
- `user_id (FK → User)`
- `conference_id (FK → Conference)`
- `topic_id (FK → ResearchTopic, optional, nullable)`
- `paper_title (nullable)`
- `bibtex (nullable)`
- `github_link (nullable)`
- `submission_status`
- `notes (nullable)`
