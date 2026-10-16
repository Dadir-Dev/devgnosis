import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Dashboard top bar. Phase 1 is display only: the search field and the
 * "New item" button are not wired to any behavior yet.
 */
export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <div className="relative w-full max-w-md">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label="Search items"
          placeholder="Search titles, content, tags..."
          className="pl-8"
        />
      </div>

      <Button type="button" className="ml-auto">
        <Plus aria-hidden="true" />
        New item
      </Button>
    </header>
  );
}
