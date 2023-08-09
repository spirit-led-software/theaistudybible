CREATE TABLE IF NOT EXISTS "devotion_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"devotion_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reaction" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "devotion_reactions_devotion_id" ON "devotion_reactions" ("devotion_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "devotion_reactions" ADD CONSTRAINT "devotion_reactions_devotion_id_devotions_id_fk" FOREIGN KEY ("devotion_id") REFERENCES "devotions"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "devotion_reactions" ADD CONSTRAINT "devotion_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
