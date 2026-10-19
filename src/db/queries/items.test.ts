import { describe, expect, it } from "vitest";

import {
  itemTagsQuery,
  pinnedItemsQuery,
  recentItemsQuery,
  systemItemTypeCountsQuery,
} from "./items";

const OWNER_ID = "user-owner";
const OTHER_USER_ID = "user-other";

describe("pinnedItemsQuery", () => {
  it("scopes the read to the resolved owner and to pinned items", () => {
    const { sql, params } = pinnedItemsQuery(OWNER_ID, 2).toSQL();

    expect(sql).toContain('"items"."owner_id"');
    expect(sql).toContain('"items"."is_pinned"');
    expect(params).toContain(OWNER_ID);
    expect(params).toContain(true);
    expect(params).not.toContain(OTHER_USER_ID);
  });

  it("joins item_types for the card type view", () => {
    const { sql } = pinnedItemsQuery(OWNER_ID, 2).toSQL();

    expect(sql).toContain('inner join "item_types"');
    expect(sql).toContain('"item_types"."key"');
    expect(sql).toContain('"item_types"."content_kind"');
  });

  it("orders by updatedAt descending with an id tie-break and applies the limit", () => {
    const { sql, params } = pinnedItemsQuery(OWNER_ID, 2).toSQL();

    expect(sql).toContain('order by "items"."updated_at" desc');
    expect(sql).toContain('"items"."id" asc');
    expect(params).toContain(2);
  });
});

describe("recentItemsQuery", () => {
  it("scopes the read to the resolved owner", () => {
    const { sql, params } = recentItemsQuery(OWNER_ID, 10).toSQL();

    expect(sql).toContain('"items"."owner_id"');
    expect(params).toContain(OWNER_ID);
    expect(params).not.toContain(OTHER_USER_ID);
    expect(sql).toContain('where "items"."owner_id" = $1 order by');
  });

  it("orders by updatedAt descending with an id tie-break and applies the limit", () => {
    const { sql, params } = recentItemsQuery(OWNER_ID, 10).toSQL();

    expect(sql).toContain('order by "items"."updated_at" desc');
    expect(sql).toContain('"items"."id" asc');
    expect(params).toContain(10);
  });
});

describe("itemTagsQuery", () => {
  it("scopes the tag read to the owner and the owner-scoped item ids", () => {
    const { sql, params } = itemTagsQuery(OWNER_ID, [
      "item-1",
      "item-2",
    ]).toSQL();

    expect(sql).toContain('"tags"."owner_id"');
    expect(sql).toContain('"item_tags"."item_id" in');
    expect(params).toContain(OWNER_ID);
    expect(params).toContain("item-1");
    expect(params).toContain("item-2");
    expect(params).not.toContain(OTHER_USER_ID);
  });

  it("reads tags in one batched query ordered by normalized name", () => {
    const { sql } = itemTagsQuery(OWNER_ID, ["item-1", "item-2", "item-3"]).toSQL();

    expect(sql).toContain('inner join "tags"');
    expect(sql).toContain('order by "tags"."normalized_name" asc');
    expect(sql.match(/from "item_tags"/g)).toHaveLength(1);
  });
});

describe("systemItemTypeCountsQuery", () => {
  it("left joins owner-scoped items so zero-count system types remain", () => {
    const { sql, params } = systemItemTypeCountsQuery(OWNER_ID).toSQL();

    expect(sql).toContain('from "item_types"');
    expect(sql).toContain('left join "items"');
    expect(sql).toContain('"items"."owner_id"');
    expect(sql).toContain('"item_types"."is_system"');
    expect(sql).toContain('count("items"."id")');
    expect(sql).toContain("group by");
    expect(params).toContain(OWNER_ID);
    expect(params).not.toContain(OTHER_USER_ID);
  });

  it("orders the grouped rows deterministically", () => {
    const { sql } = systemItemTypeCountsQuery(OWNER_ID).toSQL();

    expect(sql).toContain('order by "item_types"."key" asc');
  });
});
