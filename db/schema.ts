import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  picture: text("picture"),
  customerKey: text("customer_key").notNull().unique(),
  trialUsed: integer("trial_used").notNull().default(0),
  subscriptionStatus: text("subscription_status").notNull().default("trial"),
  billingKeyCipher: text("billing_key_cipher"),
  nextBillingAt: text("next_billing_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const usageEvents = sqliteTable("usage_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => accounts.id),
  feature: text("feature").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const payments = sqliteTable("payments", {
  orderId: text("order_id").primaryKey(),
  userId: text("user_id").notNull().references(() => accounts.id),
  paymentKey: text("payment_key"),
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
  approvedAt: text("approved_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
