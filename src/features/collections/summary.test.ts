import { describe, expect, it } from "vitest";

import {
  buildCollectionSummaries,
  pickDominantType,
  sortTypesByUsage,
  type CollectionRow,
  type CollectionTypeCountRow,
  type ItemTypeSummary,
} from "./summary";

function typeSummary(overrides: Partial<ItemTypeSummary>): ItemTypeSummary {
  return {
    id: "type-id",
    key: "snippet",
    name: "Snippet",
    color: "#3B82F6",
    icon: "CodeXml",
    count: 1,
    ...overrides,
  };
}

function typeCountRow(
  overrides: Partial<CollectionTypeCountRow>,
): CollectionTypeCountRow {
  return {
    collectionId: "collection-1",
    typeId: "type-id",
    typeKey: "snippet",
    typeName: "Snippet",
    typeColor: "#3B82F6",
    typeIcon: "CodeXml",
    itemCount: 1,
    ...overrides,
  };
}

const COLLECTION: CollectionRow = {
  id: "collection-1",
  slug: "react-patterns",
  name: "React Patterns",
  description: "Reusable patterns",
};

describe("sortTypesByUsage", () => {
  it("orders types by item count, highest first", () => {
    const sorted = sortTypesByUsage([
      typeSummary({ id: "a", key: "snippet", count: 1 }),
      typeSummary({ id: "b", key: "link", count: 3 }),
      typeSummary({ id: "c", key: "prompt", count: 2 }),
    ]);

    expect(sorted.map((type) => type.key)).toEqual([
      "link",
      "prompt",
      "snippet",
    ]);
  });

  it("breaks ties using the system type order", () => {
    const sorted = sortTypesByUsage([
      typeSummary({ id: "a", key: "prompt", count: 2 }),
      typeSummary({ id: "b", key: "snippet", count: 2 }),
    ]);

    expect(sorted.map((type) => type.key)).toEqual(["snippet", "prompt"]);
  });

  it("sorts unknown custom type keys after system types", () => {
    const sorted = sortTypesByUsage([
      typeSummary({ id: "a", key: "bookmark", count: 2 }),
      typeSummary({ id: "b", key: "link", count: 2 }),
    ]);

    expect(sorted.map((type) => type.key)).toEqual(["link", "bookmark"]);
  });
});

describe("pickDominantType", () => {
  it("returns the most-used type", () => {
    const dominant = pickDominantType([
      typeSummary({ id: "a", key: "snippet", count: 4 }),
      typeSummary({ id: "b", key: "command", count: 1 }),
    ]);

    expect(dominant?.key).toBe("snippet");
  });

  it("returns null when the collection has no items", () => {
    expect(pickDominantType([])).toBeNull();
  });
});

describe("buildCollectionSummaries", () => {
  it("sums per-type counts into the collection item count", () => {
    const [summary] = buildCollectionSummaries(
      [COLLECTION],
      [
        typeCountRow({ typeId: "t1", typeKey: "snippet", itemCount: 2 }),
        typeCountRow({
          typeId: "t2",
          typeKey: "link",
          typeName: "Link",
          typeColor: "#10B981",
          itemCount: 1,
        }),
      ],
    );

    expect(summary.itemCount).toBe(3);
    expect(summary.types.map((type) => type.key)).toEqual(["snippet", "link"]);
    expect(summary.dominantType?.key).toBe("snippet");
  });

  it("returns an empty, icon-free summary for a collection without items", () => {
    const [summary] = buildCollectionSummaries([COLLECTION], []);

    expect(summary).toEqual({
      id: COLLECTION.id,
      slug: COLLECTION.slug,
      name: COLLECTION.name,
      description: COLLECTION.description,
      itemCount: 0,
      types: [],
      dominantType: null,
    });
  });

  it("ignores type rows that belong to another collection", () => {
    const [summary] = buildCollectionSummaries(
      [COLLECTION],
      [typeCountRow({ collectionId: "collection-2", itemCount: 5 })],
    );

    expect(summary.itemCount).toBe(0);
    expect(summary.types).toEqual([]);
  });
});
