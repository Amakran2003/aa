import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const sheets = pgTable("sheets", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull().unique(),
  htmlKey: text("html_key"),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
