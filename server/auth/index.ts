import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";

import { db } from "@server/db";
import { schema } from "@server/db/schema";

const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const secret =
  process.env.BETTER_AUTH_SECRET ?? "development-secret-change-this-before-production";
const sessionCookieName = process.env.BETTER_AUTH_COOKIE_NAME ?? "user_auth";

export const auth = betterAuth({
  appName: "Vellum Workbench",
  baseURL: baseUrl,
  secret,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.BETTER_AUTH_ALLOW_SIGN_UP !== "true",
  },
  advanced: {
    cookies: {
      session_token: {
        name: sessionCookieName,
      },
    },
  },
  disabledPaths: ["/is-username-available", "/request-password-reset", "/reset-password"],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "member",
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "active",
      },
      lastLoginAt: {
        type: "date",
        required: false,
      },
      createdBy: {
        type: "string",
        required: false,
      },
    },
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
      usernameValidator: (value) => /^[a-zA-Z0-9_.]+$/.test(value),
    }),
    nextCookies(),
  ],
});
