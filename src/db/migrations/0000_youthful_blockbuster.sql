CREATE TYPE "public"."content_kind" AS ENUM('text', 'url', 'file');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"default_type_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_collections" (
	"item_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_collections_item_id_collection_id_pk" PRIMARY KEY("item_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "item_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text,
	"key" varchar(40) NOT NULL,
	"name" varchar(80) NOT NULL,
	"icon" varchar(60) NOT NULL,
	"color" varchar(7) NOT NULL,
	"content_kind" "content_kind" NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_types_owner_chk" CHECK (("item_types"."is_system" and "item_types"."owner_id" is null) or (not "item_types"."is_system" and "item_types"."owner_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"item_type_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"content" text,
	"url" text,
	"storage_key" text,
	"file_name" text,
	"mime_type" varchar(255),
	"file_size_bytes" bigint,
	"language" varchar(80),
	"is_favorite" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"last_opened_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce("items"."title", '')), 'A')
        || setweight(to_tsvector('english', coalesce("items"."description", '')), 'B')
        || setweight(to_tsvector('english', coalesce("items"."content", '')), 'C')) STORED,
	CONSTRAINT "items_payload_exclusive_chk" CHECK ((("items"."content" is not null)::int + ("items"."url" is not null)::int + ("items"."storage_key" is not null)::int) = 1),
	CONSTRAINT "items_file_fields_chk" CHECK ("items"."storage_key" is not null
        or ("items"."file_name" is null and "items"."mime_type" is null and "items"."file_size_bytes" is null)),
	CONSTRAINT "items_file_metadata_chk" CHECK ("items"."storage_key" is null
        or ("items"."file_name" is not null and "items"."mime_type" is not null
            and "items"."file_size_bytes" is not null and "items"."file_size_bytes" > 0))
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" varchar(20) DEFAULT 'stripe' NOT NULL,
	"provider_customer_id" text NOT NULL,
	"provider_subscription_id" text NOT NULL,
	"plan" varchar(20) NOT NULL,
	"status" varchar(30) NOT NULL,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"last_webhook_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" varchar(80),
	"plan" varchar(20) DEFAULT 'free' NOT NULL,
	"plan_status" varchar(30) DEFAULT 'active' NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_tags" (
	"item_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "item_tags_item_id_tag_id_pk" PRIMARY KEY("item_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" varchar(60) NOT NULL,
	"normalized_name" varchar(60) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_default_type_id_item_types_id_fk" FOREIGN KEY ("default_type_id") REFERENCES "public"."item_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_collections" ADD CONSTRAINT "item_collections_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_collections" ADD CONSTRAINT "item_collections_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_item_type_id_item_types_id_fk" FOREIGN KEY ("item_type_id") REFERENCES "public"."item_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "collections_owner_slug_idx" ON "collections" USING btree ("owner_id","slug");--> statement-breakpoint
CREATE INDEX "collections_owner_updated_idx" ON "collections" USING btree ("owner_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "item_collections_collection_added_idx" ON "item_collections" USING btree ("collection_id","added_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "item_types_system_key_idx" ON "item_types" USING btree ("key") WHERE is_system;--> statement-breakpoint
CREATE UNIQUE INDEX "item_types_owner_name_idx" ON "item_types" USING btree ("owner_id","name") WHERE not is_system;--> statement-breakpoint
CREATE INDEX "items_owner_updated_idx" ON "items" USING btree ("owner_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "items_owner_type_idx" ON "items" USING btree ("owner_id","item_type_id");--> statement-breakpoint
CREATE INDEX "items_owner_recent_idx" ON "items" USING btree ("owner_id","last_opened_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "items_search_idx" ON "items" USING gin ("search_vector");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_provider_subscription_idx" ON "subscriptions" USING btree ("provider","provider_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "item_tags_tag_item_idx" ON "item_tags" USING btree ("tag_id","item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_owner_normalized_name_idx" ON "tags" USING btree ("owner_id","normalized_name");