import { describe, expect, it } from "vitest";

import {
  collectionCountQuery,
  collectionTypeBreakdownQuery,
  itemCountQuery,
  recentCollectionsQuery,
} from "./collections";

const OWNER_ID = "user-owner";
const OTHER_USER_ID = "user-other";

describe("recentCollectionsQuery", () => {
  it("filters collections by the resolved owner", () => {
    const { sql, params } = recentCollectionsQuery(OWNER_ID, 4).toSQL();

    expect(sql).toContain('"collections"."owner_id"');
    expect(params).toContain(OWNER_ID);
    expect(params).not.toContain(OTHER_USER_ID);
  });

  it("orders by updatedAt descending and applies the limit", () => {
    const { sql } = recentCollectionsQuery(OWNER_ID, 4).toSQL();

    expect(sql).toContain('order by "collections"."updated_at" desc');
    expect(sql).toContain('"collections"."name" asc');
    expect(sql).toContain('"collections"."id" asc');
    expect(sql).toContain("limit");
  });
});

describe("collectionTypeBreakdownQuery", () => {
  it("scopes both the collection and the item to the resolved owner", () => {
    const { sql, params } = collectionTypeBreakdownQuery(OWNER_ID, [
      "collection-1",
    ]).toSQL();

    expect(sql).toContain('"collections"."owner_id"');
    expect(sql).toContain('"items"."owner_id"');
    expect(params).toContain(OWNER_ID);
    expect(params).toContain("collection-1");
    expect(params).not.toContain(OTHER_USER_ID);
  });

  it("groups by collection and item type for a set-based read", () => {
    const { sql } = collectionTypeBreakdownQuery(OWNER_ID, [
      "collection-1",
    ]).toSQL();

    expect(sql).toContain("group by");
    expect(sql).toContain('"item_collections"."collection_id"');
    expect(sql).toContain('"item_types"."id"');
  });
});

describe("dashboard count queries", () => {
  it("scopes the item total to the resolved owner", () => {
    const { sql, params } = itemCountQuery(OWNER_ID).toSQL();

    expect(sql).toContain('from "items"');
    expect(sql).toContain('"items"."owner_id"');
    expect(params).toContain(OWNER_ID);
    expect(params).not.toContain(OTHER_USER_ID);
  });

  it("scopes the collection total to the resolved owner", () => {
    const { sql, params } = collectionCountQuery(OWNER_ID).toSQL();

    expect(sql).toContain('from "collections"');
    expect(sql).toContain('"collections"."owner_id"');
    expect(params).toContain(OWNER_ID);
    expect(params).not.toContain(OTHER_USER_ID);
  });
});
