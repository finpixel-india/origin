import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";

/** Accounts — username/password (and optionally Google). */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  email: text("email"),
  name: text("name"),
  picture: text("picture"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** One JSON blob of the full ORIGIN dataset per user. */
export const appData = pgTable("app_data", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type AppDataRow = typeof appData.$inferSelect;
