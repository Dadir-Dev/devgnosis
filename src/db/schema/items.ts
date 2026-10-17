import { sql, type SQL } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  customType,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { itemTypes } from "./item-types";

const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    itemTypeId: uuid("item_type_id")
      .notNull()
      .references(() => itemTypes.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description"),

    // Exactly one payload is set: content (text) | url (link) | storage_key (file).
    content: text("content"),
    url: text("url"),
    storageKey: text("storage_key"),
    fileName: text("file_name"),
    mimeType: varchar("mime_type", { length: 255 }),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),

    language: varchar("language", { length: 80 }),
    isFavorite: boolean("is_favorite").notNull().default(false),
    isPinned: boolean("is_pinned").notNull().default(false),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    searchVector: tsvector("search_vector").generatedAlwaysAs(
      (): SQL => sql`setweight(to_tsvector('english', coalesce(${items.title}, '')), 'A')
        || setweight(to_tsvector('english', coalesce(${items.description}, '')), 'B')
        || setweight(to_tsvector('english', coalesce(${items.content}, '')), 'C')`,
    ),
  },
  (t) => [
    index("items_owner_updated_idx").on(t.ownerId, t.updatedAt.desc()),
    index("items_owner_type_idx").on(t.ownerId, t.itemTypeId),
    index("items_owner_recent_idx").on(t.ownerId, t.lastOpenedAt.desc()),
    index("items_search_idx").using("gin", t.searchVector),

    // Storage-mode invariants (the per-type payload shape is enforced in Zod, because
    // content_kind lives on item_types and cannot be referenced by a CHECK here).
    check(
      "items_payload_exclusive_chk",
      sql`((${t.content} is not null)::int + (${t.url} is not null)::int + (${t.storageKey} is not null)::int) = 1`,
    ),
    check(
      "items_file_fields_chk",
      sql`${t.storageKey} is not null
        or (${t.fileName} is null and ${t.mimeType} is null and ${t.fileSizeBytes} is null)`,
    ),
    check(
      "items_file_metadata_chk",
      sql`${t.storageKey} is null
        or (${t.fileName} is not null and ${t.mimeType} is not null
            and ${t.fileSizeBytes} is not null and ${t.fileSizeBytes} > 0)`,
    ),
  ],
);
