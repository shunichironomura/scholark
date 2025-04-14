CREATE TABLE IF NOT EXISTS "conference" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_date" text,
	"end_date" text,
	"location" text,
	"website_url" text,
	"abstract_deadline" text,
	"paper_deadline" text,
	"created_by_user_id" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "research_topic" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"topic_name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "topic_note" (
	"id" text PRIMARY KEY NOT NULL,
	"topic_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"oauth_provider" text NOT NULL,
	"oauth_provider_user_id" text NOT NULL,
	"calendar_token" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_conference_label" (
	"id" text PRIMARY KEY NOT NULL,
	"conference_id" text NOT NULL,
	"label_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_conference_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"conference_id" text NOT NULL,
	"topic_id" text,
	"paper_title" text,
	"bibtex" text,
	"github_link" text,
	"submission_status" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_label" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"label_name" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conference" ADD CONSTRAINT "conference_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "research_topic" ADD CONSTRAINT "research_topic_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "topic_note" ADD CONSTRAINT "topic_note_topic_id_research_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."research_topic"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_conference_label" ADD CONSTRAINT "user_conference_label_conference_id_conference_id_fk" FOREIGN KEY ("conference_id") REFERENCES "public"."conference"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_conference_label" ADD CONSTRAINT "user_conference_label_label_id_user_label_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."user_label"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_conference_plan" ADD CONSTRAINT "user_conference_plan_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_conference_plan" ADD CONSTRAINT "user_conference_plan_conference_id_conference_id_fk" FOREIGN KEY ("conference_id") REFERENCES "public"."conference"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_conference_plan" ADD CONSTRAINT "user_conference_plan_topic_id_research_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."research_topic"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_label" ADD CONSTRAINT "user_label_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
