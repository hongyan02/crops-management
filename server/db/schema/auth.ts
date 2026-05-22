import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const userRoleValues = ["admin", "member"] as const;
export const userStatusValues = ["active", "disabled", "invited"] as const;

export type UserRole = (typeof userRoleValues)[number];
export type UserStatus = (typeof userStatusValues)[number];

/** 用户表 — 存储用户基本信息、角色、状态及登录记录 */
export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
    image: text("image"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
    username: text("username"),
    displayUsername: text("displayUsername"),
    role: text("role", { enum: userRoleValues }).notNull().default("member"),
    status: text("status", { enum: userStatusValues }).notNull().default("active"),
    lastLoginAt: integer("lastLoginAt", { mode: "timestamp_ms" }),
    createdBy: text("createdBy"),
  },
  (table) => ({
    emailUnique: uniqueIndex("user_email_unique").on(table.email),
    usernameUnique: uniqueIndex("user_username_unique").on(table.username),
    statusIndex: index("user_status_idx").on(table.status),
  }),
);

/** 会话表 — 记录用户登录会话，包含过期时间、token、IP 及 UA 信息 */
export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => ({
    tokenUnique: uniqueIndex("session_token_unique").on(table.token),
    userIdIndex: index("session_user_id_idx").on(table.userId),
  }),
);

/** 账号表 — 存储第三方 OAuth 或密码登录的账号绑定与 token 信息 */
export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex("account_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
    userIdIndex: index("account_user_id_idx").on(table.userId),
  }),
);

/** 验证表 — 存储邮箱验证、密码重置等一次性验证 token */
export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    identifierIndex: index("verification_identifier_idx").on(table.identifier),
  }),
);

/** 用户关联 — 一个用户拥有多个会话和多个账号 */
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

/** 会话关联 — 每个会话属于一个用户 */
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

/** 账号关联 — 每个账号属于一个用户 */
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

/** Auth schema — 供 Better Auth 和 Drizzle ORM 使用 */
export const authSchema = {
  user,
  session,
  account,
  verification,
};
