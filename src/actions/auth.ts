"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";

/** Result shape consumed by `useActionState` in the sign-in form. */
export type SignInState = {
  error: string | null;
};

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(128),
});

/**
 * Minimal email/password sign-in. Better Auth owns credential verification and
 * cookie handling (via the `nextCookies` plugin); failures return a safe,
 * generic message without provider or stack details.
 */
export async function signInAction(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email address and password." };
  }

  try {
    await auth.api.signInEmail({
      body: parsed.data,
      headers: await headers(),
    });
  } catch {
    return { error: "Invalid email or password." };
  }

  // `redirect` throws, so it stays outside the try/catch.
  redirect("/dashboard");
}
