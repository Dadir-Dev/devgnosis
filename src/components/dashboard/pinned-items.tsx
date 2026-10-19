import { Check, MoreHorizontal, Pin, Star } from "lucide-react";

import { CodeBlock } from "@/components/dashboard/code-block";
import { ItemTypeIcon } from "@/components/dashboard/item-type-icon";
import { RelativeTime } from "@/components/dashboard/relative-time";
import { SectionHeading } from "@/components/dashboard/section-heading";
import type { DashboardItem } from "@/features/items/dashboard-items";
import { cn } from "@/lib/utils";

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

/** The URL's hostname, falling back to the raw value when it cannot be parsed. */
function displayUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Body preview: monospace for code, a checklist for to-do notes, prose
 * otherwise, and a muted URL/file name for link and file items.
 */
function ItemContentPreview({ item }: { item: DashboardItem }) {
  if (item.content) {
    if (item.language) {
      return <CodeBlock code={item.content} language={item.language} />;
    }

    if (item.content.split("\n").some((line) => /^- \[[ x]\] /.test(line))) {
      return <ChecklistPreview content={item.content} />;
    }

    return <p className="text-sm text-muted-foreground whitespace-pre-line">{item.content}</p>;
  }

  if (item.url) {
    return (
      <p className="truncate text-sm text-muted-foreground">{displayUrl(item.url)}</p>
    );
  }

  if (item.fileName) {
    return <p className="truncate text-sm text-muted-foreground">{item.fileName}</p>;
  }

  return null;
}

function PinnedItemCard({ item }: { item: DashboardItem }) {
  return (
    <article
      className="flex flex-col gap-3 rounded-lg border p-4"
      style={{ backgroundColor: `${item.type.color}14`, borderColor: `${item.type.color}33` }}
    >
      <header className="flex items-center gap-2">
        <ItemTypeIcon type={item.type} />
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

type PinnedItemsProps = {
  items: DashboardItem[];
};

/** Pinned items shown as two-up cards at the top of the dashboard. */
export function PinnedItems({ items }: PinnedItemsProps) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading icon={Pin}>Pinned</SectionHeading>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <PinnedItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
