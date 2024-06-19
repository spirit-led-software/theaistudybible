CREATE TABLE IF NOT EXISTS "chapter_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"chapter_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verse_bookmarks" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verse_id" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verse_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verse_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chapter_notes" ADD CONSTRAINT "chapter_notes_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verse_bookmarks" ADD CONSTRAINT "verse_bookmarks_verse_id_verses_id_fk" FOREIGN KEY ("verse_id") REFERENCES "public"."verses"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verse_notes" ADD CONSTRAINT "verse_notes_verse_id_verses_id_fk" FOREIGN KEY ("verse_id") REFERENCES "public"."verses"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chapter_notes_chapter_id" ON "chapter_notes" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chapter_notes_user_id" ON "chapter_notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verse_bookmarks_verse_id" ON "verse_bookmarks" USING btree ("verse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verse_bookmarks_user_id" ON "verse_bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verse_notes_verse_id" ON "verse_notes" USING btree ("verse_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verse_notes_user_id" ON "verse_notes" USING btree ("user_id");