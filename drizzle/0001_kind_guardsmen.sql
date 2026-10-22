CREATE TABLE "partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"phone" varchar(40),
	"coupon" varchar(60) NOT NULL,
	"discountPercent" integer DEFAULT 10 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partners_coupon_unique" UNIQUE("coupon")
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "favorite" varchar(180);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customerPhone" varchar(40);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "itemNames" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "itemsCount" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discountAmount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "couponCode" varchar(60);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "partnerName" varchar(160);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tag" varchar(60);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(40);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" text;