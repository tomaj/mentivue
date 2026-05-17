CREATE TABLE "brand_mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raw_response_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"position" integer,
	"context" text,
	"mention_strength" text,
	"sentiment" text,
	"sentiment_score" real,
	"sentiment_reasoning" text,
	"confidence" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vertical_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"website" text,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hallucination_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"llm_call_id" uuid NOT NULL,
	"brand_id" uuid,
	"claim" text NOT NULL,
	"claim_type" text,
	"contradicts_facts" boolean DEFAULT false NOT NULL,
	"contradiction" text,
	"confidence" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "klients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"company" text,
	"brand_id" uuid,
	"tier" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "klients_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "llm_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" uuid,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"call_type" text DEFAULT 'collection' NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"cached_input_tokens" integer,
	"search_fee_usd" real,
	"estimated_cost_usd" real DEFAULT 0 NOT NULL,
	"latency_ms" integer,
	"status" text DEFAULT 'success' NOT NULL,
	"error_message" text,
	"is_batch" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vertical_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"language" text DEFAULT 'sk' NOT NULL,
	"text" text NOT NULL,
	"frequency_tier" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"llm_call_id" uuid NOT NULL,
	"response_text" text NOT NULL,
	"citations" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"klient_id" uuid,
	"brand_id" uuid,
	"vertical_id" uuid,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"storage_url" text,
	"metadata" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "response_quality" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"llm_call_id" uuid NOT NULL,
	"quality_score" real NOT NULL,
	"relevance" integer,
	"specificity" integer,
	"citation_quality" integer,
	"language_correctness" integer,
	"refused" boolean DEFAULT false NOT NULL,
	"reasoning" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verticals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"category" text NOT NULL,
	"language" text DEFAULT 'sk' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verticals_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "brand_mentions" ADD CONSTRAINT "brand_mentions_raw_response_id_raw_responses_id_fk" FOREIGN KEY ("raw_response_id") REFERENCES "public"."raw_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_mentions" ADD CONSTRAINT "brand_mentions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_vertical_id_verticals_id_fk" FOREIGN KEY ("vertical_id") REFERENCES "public"."verticals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hallucination_flags" ADD CONSTRAINT "hallucination_flags_llm_call_id_llm_calls_id_fk" FOREIGN KEY ("llm_call_id") REFERENCES "public"."llm_calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hallucination_flags" ADD CONSTRAINT "hallucination_flags_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "klients" ADD CONSTRAINT "klients_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_calls" ADD CONSTRAINT "llm_calls_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_vertical_id_verticals_id_fk" FOREIGN KEY ("vertical_id") REFERENCES "public"."verticals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_responses" ADD CONSTRAINT "raw_responses_llm_call_id_llm_calls_id_fk" FOREIGN KEY ("llm_call_id") REFERENCES "public"."llm_calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_klient_id_klients_id_fk" FOREIGN KEY ("klient_id") REFERENCES "public"."klients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_vertical_id_verticals_id_fk" FOREIGN KEY ("vertical_id") REFERENCES "public"."verticals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_quality" ADD CONSTRAINT "response_quality_llm_call_id_llm_calls_id_fk" FOREIGN KEY ("llm_call_id") REFERENCES "public"."llm_calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brand_mentions_brand_idx" ON "brand_mentions" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "brand_mentions_raw_response_idx" ON "brand_mentions" USING btree ("raw_response_id");--> statement-breakpoint
CREATE UNIQUE INDEX "brands_vertical_slug_uq" ON "brands" USING btree ("vertical_id","slug");--> statement-breakpoint
CREATE INDEX "hallucination_flags_llm_call_idx" ON "hallucination_flags" USING btree ("llm_call_id");--> statement-breakpoint
CREATE INDEX "hallucination_flags_brand_idx" ON "hallucination_flags" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "llm_calls_prompt_provider_idx" ON "llm_calls" USING btree ("prompt_id","provider");--> statement-breakpoint
CREATE INDEX "llm_calls_created_at_idx" ON "llm_calls" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "llm_calls_status_idx" ON "llm_calls" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "prompts_external_id_uq" ON "prompts" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "prompts_vertical_category_idx" ON "prompts" USING btree ("vertical_id","category");--> statement-breakpoint
CREATE INDEX "prompts_frequency_tier_idx" ON "prompts" USING btree ("frequency_tier");--> statement-breakpoint
CREATE UNIQUE INDEX "raw_responses_llm_call_uq" ON "raw_responses" USING btree ("llm_call_id");--> statement-breakpoint
CREATE INDEX "reports_klient_type_idx" ON "reports" USING btree ("klient_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "response_quality_llm_call_uq" ON "response_quality" USING btree ("llm_call_id");