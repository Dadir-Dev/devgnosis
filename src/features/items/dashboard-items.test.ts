import { describe, expect, it } from "vitest";

import {
  buildDashboardItems,
  type DashboardItemRow,
} from "./dashboard-items";

function itemRow(overrides: Partial<DashboardItemRow>): DashboardItemRow {
  return {
    id: "item-1",
    title: "Rate-limited fetch utility",
    description: null,
    content: "export const fetch = () => {};",
    url: null,
    fileName: null,
    language: "typescript",
    isFavorite: false,
    isPinned: true,
    updatedAt: new Date("2026-10-16T06:30:00.000Z"),
    type: {
      id: "type-1",
      key: "snippet",
      name: "Snippet",
      color: "#3B82F6",
      icon: "CodeXml",
      contentKind: "text",
    },
    ...overrides,
  };
}

describe("buildDashboardItems", () => {
  it("groups tags by item and converts updatedAt to an ISO string", () => {
    const [item] = buildDashboardItems(
      [itemRow({ id: "item-1" })],
      [
        { itemId: "item-1", name: "react" },
        { itemId: "item-1", name: "hooks" },
        { itemId: "item-2", name: "other" },
      ],
    );

    expect(item.tags).toEqual(["react", "hooks"]);
    expect(item.updatedAt).toBe("2026-10-16T06:30:00.000Z");
    expect(typeof item.updatedAt).toBe("string");
  });

  it("uses an empty tag list when the item has no tags", () => {
    const [item] = buildDashboardItems([itemRow({ id: "item-1" })], []);

    expect(item.tags).toEqual([]);
  });

  it("keeps the joined item type on the view model", () => {
    const [item] = buildDashboardItems([itemRow({})], []);

    expect(item.type).toEqual({
      id: "type-1",
      key: "snippet",
      name: "Snippet",
      color: "#3B82F6",
      icon: "CodeXml",
      contentKind: "text",
    });
  });

  it("returns an empty array when there are no item rows", () => {
    expect(buildDashboardItems([], [{ itemId: "item-1", name: "react" }])).toEqual(
      [],
    );
  });
});
