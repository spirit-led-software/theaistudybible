CREATE TABLE IF NOT EXISTS "share_chat_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"chat_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_messages" ADD COLUMN "anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_share_options_chat_id" ON "share_chat_options" ("chat_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "share_chat_options" ADD CONSTRAINT "share_chat_options_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
