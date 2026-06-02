CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "emailVerified" boolean DEFAULT false NOT NULL,
  "image" text,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  "username" text,
  "displayUsername" text,
  "role" text DEFAULT 'member' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "lastLoginAt" timestamp with time zone,
  "createdBy" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL,
  "token" text NOT NULL,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY NOT NULL,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp with time zone,
  "refreshTokenExpiresAt" timestamp with time zone,
  "scope" text,
  "password" text,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "unit" text DEFAULT '吨' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quality_metrics" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "unit" text NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_metrics" (
  "product_id" integer NOT NULL,
  "metric_id" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "contact" text,
  "phone" text,
  "address" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "supplier_products" (
  "supplier_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "supplier_quality" (
  "id" serial PRIMARY KEY NOT NULL,
  "supplier_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "metric_id" integer NOT NULL,
  "value" text NOT NULL,
  "batch_no" text,
  "recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "buyers" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "contact" text,
  "phone" text,
  "address" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "buyer_products" (
  "buyer_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "buyer_requirements" (
  "id" serial PRIMARY KEY NOT NULL,
  "buyer_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "metric_id" integer NOT NULL,
  "quality_level" text DEFAULT 'standard' NOT NULL,
  "min_value" text,
  "max_value" text,
  "quality_standard" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "supplier_product_prices" (
  "id" serial PRIMARY KEY NOT NULL,
  "supplier_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "price" double precision NOT NULL,
  "quoted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_email_unique" ON "user" ("email");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_username_unique" ON "user" ("username");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_status_idx" ON "user" ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "session_token_unique" ON "session" ("token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("userId");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "account_provider_account_unique" ON "account" ("providerId", "accountId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("userId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_category" ON "products" ("category");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "quality_metrics_name_unique" ON "quality_metrics" ("name");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pk_product_metrics" ON "product_metrics" ("product_id", "metric_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pm_metric" ON "product_metrics" ("metric_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pk_supplier_products" ON "supplier_products" ("supplier_id", "product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sp_product" ON "supplier_products" ("product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sq_supplier" ON "supplier_quality" ("supplier_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sq_product" ON "supplier_quality" ("product_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pk_buyer_products" ON "buyer_products" ("buyer_id", "product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bp_product" ON "buyer_products" ("product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_br_buyer" ON "buyer_requirements" ("buyer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_br_product" ON "buyer_requirements" ("product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_br_metric_level" ON "buyer_requirements" ("metric_id", "quality_level");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_spp_supplier_product" ON "supplier_product_prices" ("supplier_id", "product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_spp_product" ON "supplier_product_prices" ("product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_spp_quoted_at" ON "supplier_product_prices" ("quoted_at");
