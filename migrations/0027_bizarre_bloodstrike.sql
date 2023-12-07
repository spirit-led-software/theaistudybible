CREATE TABLE IF NOT EXISTS "user_passwords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"password_hash" text NOT NULL,
	"salt" text DEFAULT '' NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
--> Move password_hash and salt from users to user_passwords
INSERT INTO "user_passwords" (
		"id",
		"created_at",
		"updated_at",
		"password_hash",
		"user_id"
	)
SELECT gen_random_uuid(),
	now(),
	now(),
	"password_hash",
	'',
	"id"
FROM "users"
WHERE "password_hash" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_passwords_user_id" ON "user_passwords" ("user_id");
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash";
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "user_passwords"
ADD CONSTRAINT "user_passwords_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
WHEN duplicate_object THEN null;
END $$;