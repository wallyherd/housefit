CREATE TYPE "public"."order_channel" AS ENUM('Delivery', 'Retirada');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('entrada', 'saida', 'ajuste');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('Recebido', 'Preparando', 'Pronto', 'Em entrega', 'Concluído');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"phone" varchar(40),
	"email" varchar(320),
	"totalOrders" integer DEFAULT 0 NOT NULL,
	"totalSpent" numeric(12, 2) DEFAULT '0' NOT NULL,
	"lastOrderAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventoryMovements" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"type" "movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"reason" varchar(180),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orderItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"productId" integer,
	"productName" varchar(180) NOT NULL,
	"quantity" integer NOT NULL,
	"unitPrice" numeric(10, 2) NOT NULL,
	"unitCost" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderNumber" varchar(30) NOT NULL,
	"customerId" integer,
	"customerName" varchar(160) NOT NULL,
	"status" "order_status" DEFAULT 'Recebido' NOT NULL,
	"channel" "order_channel" DEFAULT 'Delivery' NOT NULL,
	"paymentMethod" varchar(60),
	"subtotal" numeric(12, 2) NOT NULL,
	"deliveryFee" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_orderNumber_unique" UNIQUE("orderNumber")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(180) NOT NULL,
	"category" varchar(40) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"cost" numeric(10, 2) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"imageUrl" text,
	"isAvailable" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
