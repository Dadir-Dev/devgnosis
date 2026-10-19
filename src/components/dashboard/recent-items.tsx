import { Clock } from "lucide-react";

import { ItemTypeIcon } from "@/components/dashboard/item-type-icon";
import { RelativeTime } from "@/components/dashboard/relative-time";
import { SectionHeading } from "@/components/dashboard/section-heading";
import type { DashboardItem } from "@/features/items/dashboard-items";

type RecentItemsProps = {
  items: DashboardItem[];
};

/** The ten most recently edited items as a compact list. */
export function RecentItems({ items }: RecentItemsProps) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeading icon={Clock}>Recent items</SectionHeading>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card/50 px-6 py-10 text-center">
          <Clock aria-hidden="true" className="size-5 text-muted-foreground" />
          <p className="text-sm font-medium">No items yet</p>
          <p className="text-xs text-muted-foreground">
            Items you save will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {items.map((item) => {
            const subtitle =
              item.description ??
              (item.tags.length > 0 ? `#${item.tags.join(" #")}` : item.type.name);

            return (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <ItemTypeIcon type={item.type} className="size-8" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  {subtitle ? (
                    <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                  ) : null}
                </div>

                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                  {item.type.name}
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
      )}
    </section>
  );
}
