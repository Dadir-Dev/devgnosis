"use client";

import { useActionState, useState } from "react";

import {
  signInWithProviderAction,
  type OAuthActionState,
} from "@/actions/auth";
import { ProviderIcon } from "@/components/auth/provider-icons";
import { Button } from "@/components/ui/button";
import {
  OAUTH_PROVIDER_LABELS,
  type AuthPage,
  type OAuthProvider,
} from "@/features/auth/oauth-providers";

const INITIAL_STATE: OAuthActionState = { error: null };

type SocialProviderButtonsProps = {
  /** Only providers with complete credentials are passed from the server. */
  providers: OAuthProvider[];
  page: AuthPage;
};

/** OAuth buttons shared by `/sign-in` and `/sign-up`. */
export function SocialProviderButtons({
  providers,
  page,
}: SocialProviderButtonsProps) {
  const [state, formAction, pending] = useActionState(
    signInWithProviderAction,
    INITIAL_STATE,
  );
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(
    null,
  );

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="redirectPage" value={page} />
        {providers.map((provider) => {
          const isPending = pending && pendingProvider === provider;

          return (
            <Button
              key={provider}
              type="submit"
              name="provider"
              value={provider}
              variant="outline"
              size="lg"
              className="w-full"
              disabled={pending}
              aria-busy={isPending || undefined}
              aria-describedby={state.error ? "oauth-error" : undefined}
              onClick={() => setPendingProvider(provider)}
            >
              <ProviderIcon provider={provider} />
              {isPending
                ? "Redirecting…"
                : `Continue with ${OAUTH_PROVIDER_LABELS[provider]}`}
            </Button>
          );
        })}
      </form>

      {state.error ? (
        <p id="oauth-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
    </div>
  );
}
