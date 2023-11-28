CREATE TABLE IF NOT EXISTS "ai_response_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ai_response_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reaction" text NOT NULL,
	"comment" text
);
--> statement-breakpoint
ALTER TABLE "devotion_reactions" ADD COLUMN "comment" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_response_reactions_ai_response_id" ON "ai_response_reactions" ("ai_response_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_response_reactions" ADD CONSTRAINT "ai_response_reactions_ai_response_id_ai_responses_id_fk" FOREIGN KEY ("ai_response_id") REFERENCES "ai_responses"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_response_reactions" ADD CONSTRAINT "ai_response_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
