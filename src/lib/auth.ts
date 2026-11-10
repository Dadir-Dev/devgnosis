import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import { db } from "../db";
import * as schema from "../db/schema";
import { env } from "./env";

const socialProviders = {
  ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        },
      }
    : {}),
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    disableSignUp: !env.AUTH_EMAIL_SIGN_UP_ENABLED,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (
            !env.AUTH_EMAIL_SIGN_UP_ENABLED &&
            user.emailVerified === false
          ) {
            throw APIError.from("FORBIDDEN", {
              code: "OAUTH_EMAIL_NOT_VERIFIED",
              message:
                "The provider did not confirm this email address. Verify it with the provider and try again.",
            });
          }
        },
      },
    },
  },
  socialProviders,
  account: {
    encryptOAuthTokens: true,
  },
  // Must stay last: forwards Better Auth's Set-Cookie headers to Next.js so
  // Server Actions (e.g. sign-in) can persist the session cookie and OAuth
  // state cookies reach the callback route.
  plugins: [nextCookies()],
});
