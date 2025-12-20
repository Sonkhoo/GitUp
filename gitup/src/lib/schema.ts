import { integer, pgTable, varchar, text, timestamp, index, uniqueIndex, uuid, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
// Define User table
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  displayName: varchar("displayname"), // Optional custom field
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// Define Todo table
export const todos = pgTable("todo", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id").notNull().references(() => user.id),
  title: text("title").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  deletedAt: timestamp("deleted_at"),
}, 
(t) => [
  index("todo_user_created_idx").on(t.userId, t.createdAt),
]);

// Define Habit table
export const habits = pgTable("habit", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id").notNull().references(() => user.id),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),

  frequency: text("frequency").notNull(), // DAILY | WEEKLY
  daysOfWeek: integer("days_of_week").array(),

  createdAt: timestamp("created_at").defaultNow(),
});

// Define Habit Completions table
export const habitCompletions = pgTable("habit_completions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  habitId: integer("habit_id").notNull().references(() => habits.id),
  date: timestamp("date").notNull(),
}, 
(t) => [
  uniqueIndex("habit_day_unique").on(t.habitId, t.date),
]);

// Define Follow table
export const follows = pgTable("follow", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  followerId: text("follower_id").notNull().references(() => user.id),
  followingId: text("following_id").notNull().references(() => user.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  uniqueIndex("follow_unique").on(t.followerId, t.followingId),
]);



export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
