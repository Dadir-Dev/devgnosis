import { Check, MoreHorizontal, Pin, Star } from "lucide-react";

import { ItemTypeIcon } from "@/components/dashboard/item-type-icon";
import { RelativeTime } from "@/components/dashboard/relative-time";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { getItemTypeById } from "@/lib/item-types";
import { items, type MockItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const pinnedItems = items.filter((item) => item.isPinned);

/** Renders a checklist body, turning `- [ ]` / `- [x]` lines into checkboxes. */
function ChecklistPreview({ content }: { content: string }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {content.split("\n").map((line, index) => {
        const match = /^- \[([ x])\] (.*)$/.exec(line);
        if (!match) {
          return (
            <li key={index} className="text-muted-foreground">
              {line}
            </li>
          );
        }

        const done = match[1] === "x";

        return (
          <li key={index} className={cn("flex items-start gap-2", done && "text-muted-foreground")}>
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 grid size-4 shrink-0 place-items-center rounded border border-border",
                done && "bg-muted",
              )}
            >
              {done ? <Check className="size-3" /> : null}
            </span>
            <span className={cn("min-w-0", done && "line-through")}>{match[2]}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Body preview: monospace for code, a checklist for to-do notes, prose otherwise. */
function ItemContentPreview({ item }: { item: MockItem }) {
  if (!item.content) return null;

  if (item.language) {
    return (
      <pre className="overflow-hidden rounded-md bg-muted/50 p-3 font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
        {item.content}
      </pre>
    );
  }

  if (item.content.split("\n").some((line) => /^- \[[ x]\] /.test(line))) {
    return <ChecklistPreview content={item.content} />;
  }

  return <p className="text-sm text-muted-foreground whitespace-pre-line">{item.content}</p>;
}

function PinnedItemCard({ item }: { item: MockItem }) {
  const type = getItemTypeById(item.itemTypeId);

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <header className="flex items-center gap-2">
        <ItemTypeIcon type={type} />
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</h3>
        <Pin aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
        {item.isFavorite ? (
          <Star aria-hidden="true" className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
        ) : null}
        <span aria-hidden="true" className="shrink-0 text-muted-foreground">
          <MoreHorizontal className="size-4" />
        </span>
      </header>

      <ItemContentPreview item={item} />

      <footer className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1">
        {item.tags.map((tag) => (
          <span key={tag} className="text-xs text-muted-foreground">
            #{tag}
          </span>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          Edited <RelativeTime iso={item.updatedAt} />
        </span>
      </footer>
    </article>
  );
}

/** Pinned items shown as two-up cards at the top of the dashboard. */
export function PinnedItems() {
  if (pinnedItems.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading icon={Pin}>Pinned</SectionHeading>
      <div className="grid gap-4 md:grid-cols-2">
        {pinnedItems.map((item) => (
          <PinnedItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
