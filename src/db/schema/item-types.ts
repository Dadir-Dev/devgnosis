import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const contentKind = pgEnum("content_kind", ["text", "url", "file"]);

export const itemTypes = pgTable(
  "item_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Null for system types; set for owner-defined custom types.
    ownerId: text("owner_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    key: varchar("key", { length: 40 }).notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    icon: varchar("icon", { length: 60 }).notNull(),
    color: varchar("color", { length: 7 }).notNull(), // hex, e.g. #3B82F6
    contentKind: contentKind("content_kind").notNull(),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // System keys are globally unique.
    uniqueIndex("item_types_system_key_idx")
      .on(t.key)
      .where(sql`is_system`),
    // Custom type names are unique per owner.
    uniqueIndex("item_types_owner_name_idx")
      .on(t.ownerId, t.name)
      .where(sql`not is_system`),
    // A row is either a system type (no owner) or an owned custom type.
    check(
      "item_types_owner_chk",
      sql`(${t.isSystem} and ${t.ownerId} is null) or (not ${t.isSystem} and ${t.ownerId} is not null)`,
    ),
  ],
);
