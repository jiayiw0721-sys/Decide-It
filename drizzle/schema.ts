import { index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type DecisionPreference = "want" | "neutral" | "avoid";

export type DecisionOption = {
  id: string;
  label: string;
  preference: DecisionPreference;
};

export const decisionRecords = mysqlTable(
  "decisionRecords",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    question: varchar("question", { length: 240 }).notNull(),
    options: json("options").$type<DecisionOption[]>().notNull(),
    mode: mysqlEnum("mode", ["fair", "weighted"]).notNull(),
    chosenOption: varchar("chosenOption", { length: 160 }).notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("decisionRecords_user_created_idx").on(table.userId, table.createdAt)]
);

export type DecisionRecord = typeof decisionRecords.$inferSelect;
export type InsertDecisionRecord = typeof decisionRecords.$inferInsert;
