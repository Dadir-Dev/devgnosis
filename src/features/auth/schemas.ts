import { z } from "zod";

import { AUTH_PAGES, OAUTH_PROVIDERS } from "./oauth-providers";

export const oauthSignInSchema = z.object({
  provider: z.enum(OAUTH_PROVIDERS),
  redirectPage: z.enum(AUTH_PAGES),
});

export type OAuthSignInInput = z.infer<typeof oauthSignInSchema>;

export const SIGN_UP_FIELDS = [
  "name",
  "email",
  "password",
  "confirmPassword",
] as const;

export type SignUpField = (typeof SIGN_UP_FIELDS)[number];

/** Matches Better Auth's email/password defaults: 8–128 characters. */
export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter your name.")
      .max(80, "Name must be 80 characters or fewer."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email("Enter a valid email address.")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be 128 characters or fewer."),
    confirmPassword: z
      .string()
      .min(1, "Confirm your password.")
      .max(128, "Password must be 128 characters or fewer."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
