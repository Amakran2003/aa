import { doublePrecision, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const sheets = pgTable("sheets", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull().unique(),
  htmlKey: text("html_key"),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  budgetTotal: doublePrecision("budget_total"),
  setAside: doublePrecision("set_aside"),
  salePrice: doublePrecision("sale_price"),
  contributionRate: doublePrecision("contribution_rate"),
  paymentRate: doublePrecision("payment_rate"),
  marginFloor: doublePrecision("margin_floor"),
  unitCap: doublePrecision("unit_cap"),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const costs = pgTable(
  "costs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    productUrl: text("product_url").notNull(),
    line: text("line").notNull(),
    amount: doublePrecision("amount").notNull(),
    updatedBy: text("updated_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("costs_project_product_line").on(table.projectId, table.productUrl, table.line)],
);
