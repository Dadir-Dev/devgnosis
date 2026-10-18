import { and, eq, sql } from "drizzle-orm";

import { db } from "./index";
import {
  collections,
  itemCollections,
  itemTags,
  itemTypes,
  items,
  subscriptions,
  tags,
  userProfiles,
} from "./schema";
import { user } from "./schema/auth";

export type SmokeCheck = {
  name: string;
  passed: boolean;
  detail?: string;
};

type Db = typeof db;

async function expectReject(
  run: () => Promise<unknown>,
): Promise<{ passed: boolean; detail?: string }> {
  try {
    await run();
    return { passed: false, detail: "expected rejection, got success" };
  } catch {
    return { passed: true };
  }
}

/**
 * Read/write smoke checks against the connected database. Safe to reuse from a
 * test runner: it takes a client, returns results, and never calls process.exit.
 * All rows it creates are removed before it returns (via user cascade + a
 * best-effort cleanup).
 */
export async function runSmokeChecks(client: Db = db): Promise<SmokeCheck[]> {
  const results: SmokeCheck[] = [];
  const record = (name: string, passed: boolean, detail?: string): void => {
    results.push(detail === undefined ? { name, passed } : { name, passed, detail });
  };

  const userId = `smoke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    try {
      const res = await client.execute(
        sql`select current_setting('neon.branch_id', true) as branch`,
      );
      const branch = (res.rows[0] as { branch: string | null } | undefined)?.branch;
      record("connected to a Neon branch", Boolean(branch), branch ?? "unknown branch");
    } catch (error) {
      record(
        "connected to a Neon branch",
        false,
        error instanceof Error ? error.message : String(error),
      );
    }

    try {
      const res = await client.execute(
        sql`select count(*)::int as n from drizzle."__drizzle_migrations"`,
      );
      const applied = Number((res.rows[0] as { n: number } | undefined)?.n ?? 0);
      record("migrations applied", applied >= 1, `applied=${applied}`);
    } catch (error) {
      record(
        "migrations applied",
        false,
        `no drizzle.__drizzle_migrations (${
          error instanceof Error ? error.message : String(error)
        })`,
      );
    }

    await client.insert(user).values({ id: userId, name: "Smoke", email: `${userId}@example.test` });

    const systemTypes = await client
      .select()
      .from(itemTypes)
      .where(eq(itemTypes.isSystem, true));
    record("seven system item types present", systemTypes.length === 7, `found=${systemTypes.length}`);

    const systemType = systemTypes[0];
    if (!systemType) {
      record("seeded system type available", false, "no system item type found");
      return results;
    }

    const twoPayloads = await expectReject(() =>
      client.insert(items).values({
        ownerId: userId,
        itemTypeId: systemType.id,
        title: "bad",
        content: "x",
        url: "https://example.com",
      }),
    );
    record(
      "payload-exclusivity CHECK rejects two payloads",
      twoPayloads.passed,
      twoPayloads.detail,
    );

    const fileWithoutMetadata = await expectReject(() =>
      client.insert(items).values({
        ownerId: userId,
        itemTypeId: systemType.id,
        title: "bad",
        storageKey: "k",
      }),
    );
    record(
      "file-metadata CHECK rejects storage_key without metadata",
      fileWithoutMetadata.passed,
      fileWithoutMetadata.detail,
    );

    const ownedSystemType = await expectReject(() =>
      client.insert(itemTypes).values({
        ownerId: userId,
        key: `smoke_${userId}`,
        name: "Smoke",
        icon: "X",
        color: "#000000",
        contentKind: "text",
        isSystem: true,
      }),
    );
    record(
      "owner CHECK rejects a system type with an owner",
      ownedSystemType.passed,
      ownedSystemType.detail,
    );

    const [textItem] = await client
      .insert(items)
      .values({
        ownerId: userId,
        itemTypeId: systemType.id,
        title: "smoke",
        content: "searchable smoke content",
      })
      .returning();

    const found = await client
      .select()
      .from(items)
      .where(
        and(
          eq(items.ownerId, userId),
          sql`${items.searchVector} @@ plainto_tsquery('english', 'searchable')`,
        ),
      );
    record("GIN full-text search returns the owner-scoped row", found.length === 1, `found=${found.length}`);

    const [collection] = await client
      .insert(collections)
      .values({ ownerId: userId, slug: `smoke-${userId}`, name: "Smoke" })
      .returning();
    await client
      .insert(itemCollections)
      .values({ itemId: textItem.id, collectionId: collection.id });
    await client.delete(items).where(eq(items.id, textItem.id));
    const leftoverJoins = await client
      .select()
      .from(itemCollections)
      .where(eq(itemCollections.collectionId, collection.id));
    record("deleting an item cascades its join rows", leftoverJoins.length === 0, `left=${leftoverJoins.length}`);

    const [keptItem] = await client
      .insert(items)
      .values({ ownerId: userId, itemTypeId: systemType.id, title: "keep", content: "x" })
      .returning();

    const restrictDelete = await expectReject(() =>
      client.delete(itemTypes).where(eq(itemTypes.id, systemType.id)),
    );
    record(
      "deleting an item_type with items is restricted",
      restrictDelete.passed,
      restrictDelete.detail,
    );

    await client.insert(userProfiles).values({ userId });
    await client.insert(subscriptions).values({
      userId,
      provider: "stripe",
      providerCustomerId: `cus_${userId}`,
      providerSubscriptionId: `sub_${userId}`,
      plan: "pro",
      status: "active",
    });
    const [tag] = await client
      .insert(tags)
      .values({ ownerId: userId, name: "Smoke", normalizedName: `smoke-${userId}` })
      .returning();
    await client.insert(itemTags).values({ itemId: keptItem.id, tagId: tag.id });

    await client.delete(user).where(eq(user.id, userId));

    const cascaded = await Promise.all([
      client.select().from(items).where(eq(items.ownerId, userId)),
      client.select().from(collections).where(eq(collections.ownerId, userId)),
      client.select().from(tags).where(eq(tags.ownerId, userId)),
      client.select().from(userProfiles).where(eq(userProfiles.userId, userId)),
      client.select().from(subscriptions).where(eq(subscriptions.userId, userId)),
    ]);
    record(
      "deleting a user cascades owned rows",
      cascaded.every((rows) => rows.length === 0),
      `left=${JSON.stringify(cascaded.map((rows) => rows.length))}`,
    );
  } catch (error) {
    record(
      "smoke checks ran to completion",
      false,
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    // Invariant rows created above are removed by cascade; this covers the case
    // where an assertion aborted the run partway through.
    await client.delete(user).where(eq(user.id, userId)).catch(() => undefined);
  }

  return results;
}
