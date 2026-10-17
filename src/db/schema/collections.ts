import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { itemTypes } from "./item-types";
import { items } from "./items";

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    isFavorite: boolean("is_favorite").notNull().default(false),
    defaultTypeId: uuid("default_type_id").references(() => itemTypes.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("collections_owner_slug_idx").on(t.ownerId, t.slug),
    index("collections_owner_updated_idx").on(t.ownerId, t.updatedAt.desc()),
  ],
);

export const itemCollections = pgTable(
  "item_collections",
  {
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.itemId, t.collectionId] }),
    index("item_collections_collection_added_idx").on(
      t.collectionId,
      t.addedAt.desc(),
    ),
  ],
);
