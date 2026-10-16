import { FolderOpen } from "lucide-react";
import Link from "next/link";

import { ItemTypeIcon } from "@/components/dashboard/item-type-icon";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { getItemTypeById, TYPE_ICONS } from "@/lib/item-types";
import { collections } from "@/lib/mock-data";

const recentCollections = [...collections]
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  .slice(0, 4);

/** Recently updated collections as color-tinted cards. */
export function RecentCollections() {
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {recentCollections.map((collection) => {
          const defaultType = getItemTypeById(collection.defaultTypeId);
          const tint = defaultType?.color ?? "#6B7280";

          return (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className="flex flex-col gap-3 rounded-lg border p-4 transition-shadow outline-none hover:ring-1 hover:ring-ring/40 focus-visible:ring-2 focus-visible:ring-ring/50"
              style={{ backgroundColor: `${tint}14`, borderColor: `${tint}33` }}
            >
              <div className="flex items-center gap-2">
                <ItemTypeIcon type={defaultType} />
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
                {collection.itemTypeIds.map((id) => {
                  const type = getItemTypeById(id);
                  if (!type) return null;
                  const Icon = TYPE_ICONS[type.key];
                  return (
                    <Icon
                      key={id}
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
    </section>
  );
}
