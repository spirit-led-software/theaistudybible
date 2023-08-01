ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_stripe_customer_id" ON "users" ("stripe_customer_id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified";