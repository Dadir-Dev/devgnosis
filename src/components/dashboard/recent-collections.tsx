import { FolderOpen } from "lucide-react";
import Link from "next/link";

import { ItemTypeIcon } from "@/components/dashboard/item-type-icon";
import { SectionHeading } from "@/components/dashboard/section-heading";
import {
  NEUTRAL_COLLECTION_COLOR,
  type CollectionSummary,
} from "@/features/collections/summary";
import { FALLBACK_TYPE_ICON, TYPE_ICONS } from "@/lib/item-types";

type RecentCollectionsProps = {
  collections: CollectionSummary[];
};

/** Recently updated collections as color-tinted cards. */
export function RecentCollections({ collections }: RecentCollectionsProps) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeading
        icon={FolderOpen}
        action={
          <Link
            href="/collections"
            className="rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            View all
          </Link>
        }
      >
        Recent collections
      </SectionHeading>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card/50 px-6 py-10 text-center">
          <FolderOpen
            aria-hidden="true"
            className="size-5 text-muted-foreground"
          />
          <p className="text-sm font-medium">No collections yet</p>
          <p className="text-xs text-muted-foreground">
            Collections you create will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {collections.map((collection) => {
            const tint =
              collection.dominantType?.color ?? NEUTRAL_COLLECTION_COLOR;

            return (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="flex flex-col gap-3 rounded-lg border p-4 transition-shadow outline-none hover:ring-1 hover:ring-ring/40 focus-visible:ring-2 focus-visible:ring-ring/50"
                style={{ backgroundColor: `${tint}14`, borderColor: `${tint}33` }}
              >
                <div className="flex items-center gap-2">
                  <ItemTypeIcon type={collection.dominantType} />
                  <span className="ml-auto text-xs text-muted-foreground">
                    {collection.itemCount} items
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold">{collection.name}</h3>
                  {collection.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {collection.description}
                    </p>
                  ) : null}
                </div>

                <div className="mt-auto flex items-center gap-1.5">
                  {collection.types.map((type) => {
                    const Icon = TYPE_ICONS[type.key] ?? FALLBACK_TYPE_ICON;
                    return (
                      <Icon
                        key={type.id}
                        aria-hidden="true"
                        className="size-3.5"
                        style={{ color: type.color }}
                      />
                    );
                  })}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
