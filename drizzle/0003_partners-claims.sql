ALTER TABLE "claims" ADD COLUMN "relationship" text DEFAULT 'owner' NOT NULL;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "proposal" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "domain_match" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "reviewer_id" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "partner_keys" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "partner_keys" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "partner_keys" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_keys" ADD CONSTRAINT "partner_keys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "claims_status_idx" ON "claims" USING btree ("status","created_at");