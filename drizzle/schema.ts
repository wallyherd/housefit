import { boolean, integer, numeric, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const statusEnum = pgEnum("order_status", ["Recebido", "Preparando", "Pronto", "Em entrega", "Concluído"]);
export const channelEnum = pgEnum("order_channel", ["Delivery", "Retirada"]);
export const movementTypeEnum = pgEnum("movement_type", ["entrada", "saida", "ajuste"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  password: text("password"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  cost: numeric("cost", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0).notNull(),
  imageUrl: text("imageUrl"),
  tag: varchar("tag", { length: 60 }),
  isAvailable: integer("isAvailable").default(1).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  totalOrders: integer("totalOrders").default(0).notNull(),
  totalSpent: numeric("totalSpent", { precision: 12, scale: 2 }).default("0").notNull(),
  favorite: varchar("favorite", { length: 180 }),
  lastOrderAt: timestamp("lastOrderAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 30 }).notNull().unique(),
  customerId: integer("customerId"),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 40 }),
  status: statusEnum("status").default("Recebido").notNull(),
  channel: channelEnum("channel").default("Delivery").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 60 }),
  itemNames: text("itemNames"), // JSON string array
  itemsCount: integer("itemsCount").default(1).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric("discountAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  couponCode: varchar("couponCode", { length: 60 }),
  partnerName: varchar("partnerName", { length: 160 }),
  deliveryFee: numeric("deliveryFee", { precision: 12, scale: 2 }).default("0").notNull(),
  deliveryCity: varchar("deliveryCity", { length: 100 }),
  deliveryAddress: text("deliveryAddress"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  productId: integer("productId"),
  productName: varchar("productName", { length: 180 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unitPrice", { precision: 10, scale: 2 }).notNull(),
  unitCost: numeric("unitCost", { precision: 10, scale: 2 }).notNull(),
});

export const inventoryMovements = pgTable("inventoryMovements", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull(),
  type: movementTypeEnum("type").notNull(),
  quantity: integer("quantity").notNull(),
  reason: varchar("reason", { length: 180 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  coupon: varchar("coupon", { length: 60 }).notNull().unique(),
  discountPercent: integer("discountPercent").default(10).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;
