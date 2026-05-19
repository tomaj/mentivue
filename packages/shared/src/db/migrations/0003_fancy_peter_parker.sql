ALTER TABLE "reports" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "rejection_notes" text;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_approved_by_klients_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."klients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "reports_klient_type_period_uq" ON "reports" USING btree ("klient_id","type","period_end");