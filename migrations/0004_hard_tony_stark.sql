ALTER TABLE "messages" ADD COLUMN "tool_invocations" jsonb;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "finish_reason" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "regenerated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "model_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "search_queries" jsonb;--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN IF EXISTS "name";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN IF EXISTS "function_call";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN IF EXISTS "tool_calls";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN IF EXISTS "metadata";