import { Clock } from "lucide-react";

import { ItemTypeIcon } from "@/components/dashboard/item-type-icon";
import { RelativeTime } from "@/components/dashboard/relative-time";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { getItemTypeById } from "@/lib/item-types";
import { items } from "@/lib/mock-data";

const recentItems = [...items]
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  .slice(0, 10);

/** The ten most recently edited items as a compact list. */
export function RecentItems() {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeading icon={Clock}>Recent items</SectionHeading>

      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {recentItems.map((item) => {
          const type = getItemTypeById(item.itemTypeId);
          const subtitle =
            item.description ?? (item.tags.length > 0 ? `#${item.tags.join(" #")}` : type?.name);

          return (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <ItemTypeIcon type={type} className="size-8" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                {subtitle ? (
                  <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                ) : null}
              </div>

              <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                {type?.name}
              </span>

              <time
                dateTime={item.updatedAt}
                className="shrink-0 text-xs text-muted-foreground tabular-nums"
              >
                <RelativeTime iso={item.updatedAt} />
              </time>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
