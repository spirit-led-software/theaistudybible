ALTER TYPE "index_operation_type" ADD VALUE 'WEBPAGE';--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ai_responses" ALTER COLUMN "user_message_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ai_responses" ALTER COLUMN "chat_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ai_responses" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "user_messages" ALTER COLUMN "chat_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "user_messages" ALTER COLUMN "user_id" SET DATA TYPE uuid;