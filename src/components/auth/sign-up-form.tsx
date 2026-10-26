"use client";

import { useActionState } from "react";

import { signUpAction, type SignUpState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SignUpField } from "@/features/auth/schemas";

const INITIAL_STATE: SignUpState = { error: null };

function fieldErrorId(field: SignUpField): string {
  return `sign-up-${field}-error`;
}

/** Email/password registration form for `/sign-up`. */
export function SignUpForm() {
  const [state, formAction, pending] = useActionState(
    signUpAction,
    INITIAL_STATE,
  );
  const fieldErrors = state.fieldErrors ?? {};

  function describedBy(field: SignUpField): string | undefined {
    const ids: string[] = [];

    if (fieldErrors[field]) {
      ids.push(fieldErrorId(field));
    }

    if (state.error) {
      ids.push("sign-up-error");
    }

    return ids.length > 0 ? ids.join(" ") : undefined;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={80}
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={describedBy("name")}
        />
        {fieldErrors.name ? (
          <p id={fieldErrorId("name")} className="text-sm text-destructive">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={describedBy("email")}
        />
        {fieldErrors.email ? (
          <p id={fieldErrorId("email")} className="text-sm text-destructive">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          aria-invalid={fieldErrors.password ? true : undefined}
          aria-describedby={describedBy("password")}
        />
        {fieldErrors.password ? (
          <p id={fieldErrorId("password")} className="text-sm text-destructive">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm password
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          maxLength={128}
          aria-invalid={fieldErrors.confirmPassword ? true : undefined}
          aria-describedby={describedBy("confirmPassword")}
        />
        {fieldErrors.confirmPassword ? (
          <p
            id={fieldErrorId("confirmPassword")}
            className="text-sm text-destructive"
          >
            {fieldErrors.confirmPassword}
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p id="sign-up-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
