ALTER TABLE "devotions" ADD COLUMN "date" date DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "devotions_date" ON "devotions" ("date");