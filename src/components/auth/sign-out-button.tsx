"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";

import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

function SignOutSubmit() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon-sm"
      className="shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground"
      disabled={pending}
      aria-busy={pending || undefined}
      title="Sign out"
    >
      <LogOut aria-hidden="true" />
      <span className="sr-only">{pending ? "Signing out…" : "Sign out"}</span>
    </Button>
  );
}

/** Ends the current session and returns to `/sign-in`. */
export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SignOutSubmit />
    </form>
  );
}
