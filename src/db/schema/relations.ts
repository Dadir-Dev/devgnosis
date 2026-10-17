import { relations } from "drizzle-orm";

import { user } from "./auth";
import { collections, itemCollections } from "./collections";
import { itemTypes } from "./item-types";
import { items } from "./items";
import { subscriptions, userProfiles } from "./profiles";
import { itemTags, tags } from "./tags";

// Auth-table relations (user/session/account) are generated in `auth.ts`. Do not
// redeclare relations on `user` here — Drizzle allows a single relations() call per
// table, and overwriting it would drop Better Auth's session/account relations.

export const itemTypesRelations = relations(itemTypes, ({ one, many }) => ({
  owner: one(user, { fields: [itemTypes.ownerId], references: [user.id] }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  owner: one(user, { fields: [items.ownerId], references: [user.id] }),
  itemType: one(itemTypes, {
    fields: [items.itemTypeId],
    references: [itemTypes.id],
  }),
  collections: many(itemCollections),
  tags: many(itemTags),
}));

export const collectionsRelations = relations(
  collections,
  ({ one, many }) => ({
    owner: one(user, { fields: [collections.ownerId], references: [user.id] }),
    defaultType: one(itemTypes, {
      fields: [collections.defaultTypeId],
      references: [itemTypes.id],
    }),
    items: many(itemCollections),
  }),
);

export const itemCollectionsRelations = relations(
  itemCollections,
  ({ one }) => ({
    item: one(items, {
      fields: [itemCollections.itemId],
      references: [items.id],
    }),
    collection: one(collections, {
      fields: [itemCollections.collectionId],
      references: [collections.id],
    }),
  }),
);

export const tagsRelations = relations(tags, ({ one, many }) => ({
  owner: one(user, { fields: [tags.ownerId], references: [user.id] }),
  items: many(itemTags),
}));

export const itemTagsRelations = relations(itemTags, ({ one }) => ({
  item: one(items, { fields: [itemTags.itemId], references: [items.id] }),
  tag: one(tags, { fields: [itemTags.tagId], references: [tags.id] }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(user, { fields: [userProfiles.userId], references: [user.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(user, { fields: [subscriptions.userId], references: [user.id] }),
}));
