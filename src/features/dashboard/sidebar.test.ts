import { describe, expect, it } from "vitest";

import { NEUTRAL_COLLECTION_COLOR, type CollectionSummary } from "@/features/collections/summary";

import {
  buildSidebarCollections,
  buildSidebarItemTypes,
  formatTypeLabel,
  type SidebarCollectionRow,
  type SidebarItemTypeRow,
} from "./sidebar";

function itemTypeRow(
  overrides: Partial<SidebarItemTypeRow>,
): SidebarItemTypeRow {
  return {
    id: "type-id",
    key: "snippet",
    name: "Snippet",
    color: "#3B82F6",
    icon: "CodeXml",
    contentKind: "text",
    itemCount: 0,
    ...overrides,
  };
}

function collectionSummary(
  overrides: Partial<CollectionSummary>,
): CollectionSummary {
  return {
    id: "collection-1",
    slug: "collection-1",
    name: "Collection",
    description: null,
    itemCount: 0,
    types: [],
    dominantType: null,
    ...overrides,
  };
}

function collectionRow(
  overrides: Partial<SidebarCollectionRow>,
): SidebarCollectionRow {
  return {
    id: "collection-1",
    isFavorite: false,
    ...overrides,
  };
}

describe("formatTypeLabel", () => {
  it("pluralizes the singular seeded type names", () => {
    expect(formatTypeLabel("Snippet")).toBe("Snippets");
    expect(formatTypeLabel("Image")).toBe("Images");
  });

  it("leaves already-plural names untouched", () => {
    expect(formatTypeLabel("Prompts")).toBe("Prompts");
  });
});

describe("buildSidebarItemTypes", () => {
  it("orders types canonically and applies plural labels", () => {
    const types = buildSidebarItemTypes(
      [
        itemTypeRow({ id: "image", key: "image", name: "Image", contentKind: "file" }),
        itemTypeRow({ id: "snippet", key: "snippet", name: "Snippet", itemCount: 4 }),
        itemTypeRow({ id: "prompt", key: "prompt", name: "Prompt", itemCount: 2 }),
      ],
      "free",
    );

    expect(types.map((type) => type.key)).toEqual([
      "snippet",
      "prompt",
      "image",
    ]);
    expect(types.map((type) => type.label)).toEqual([
      "Snippets",
      "Prompts",
      "Images",
    ]);
    expect(types[0]?.itemCount).toBe(4);
  });

  it("locks file types for free users", () => {
    const types = buildSidebarItemTypes(
      [
        itemTypeRow({ id: "snippet", key: "snippet", contentKind: "text" }),
        itemTypeRow({ id: "file", key: "file", contentKind: "file" }),
        itemTypeRow({ id: "image", key: "image", contentKind: "file" }),
      ],
      "free",
    );

    expect(types.filter((type) => type.isLocked).map((type) => type.key)).toEqual([
      "file",
      "image",
    ]);
  });

  it("shows counts instead of locks for pro users", () => {
    const types = buildSidebarItemTypes(
      [
        itemTypeRow({ id: "file", key: "file", contentKind: "file", itemCount: 3 }),
        itemTypeRow({ id: "image", key: "image", contentKind: "file", itemCount: 2 }),
      ],
      "pro",
    );

    expect(types.every((type) => !type.isLocked)).toBe(true);
    expect(types.map((type) => type.itemCount)).toEqual([3, 2]);
  });
});

describe("buildSidebarCollections", () => {
  it("splits favorites from recents and caps recents at four", () => {
    const rows: SidebarCollectionRow[] = [
      collectionRow({ id: "favorite", isFavorite: true }),
      collectionRow({ id: "recent-1" }),
      collectionRow({ id: "recent-2" }),
      collectionRow({ id: "recent-3" }),
      collectionRow({ id: "recent-4" }),
      collectionRow({ id: "recent-5" }),
    ];
    const summaries = rows.map((row) =>
      collectionSummary({ id: row.id, slug: row.id, name: row.id }),
    );

    const sidebar = buildSidebarCollections(rows, summaries);

    expect(sidebar.favorites.map((collection) => collection.id)).toEqual([
      "favorite",
    ]);
    expect(sidebar.recents.map((collection) => collection.id)).toEqual([
      "recent-1",
      "recent-2",
      "recent-3",
      "recent-4",
    ]);
  });

  it("uses the dominant type color and falls back to neutral", () => {
    const rows = [
      collectionRow({ id: "tinted" }),
      collectionRow({ id: "empty" }),
    ];
    const summaries = [
      collectionSummary({
        id: "tinted",
        dominantType: {
          id: "type-snippet",
          key: "snippet",
          name: "Snippet",
          color: "#3B82F6",
          icon: "CodeXml",
          count: 3,
        },
      }),
      collectionSummary({ id: "empty" }),
    ];

    const sidebar = buildSidebarCollections(rows, summaries);

    expect(sidebar.recents[0]?.dominantColor).toBe("#3B82F6");
    expect(sidebar.recents[1]?.dominantColor).toBe(
      NEUTRAL_COLLECTION_COLOR,
    );
  });
});
