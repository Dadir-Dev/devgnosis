import "server-only";

import { DEMO_USER, ensureDemoProfile, ensureDemoUser } from "./demo-account";
import { seedSystemItemTypes, SYSTEM_ITEM_TYPES } from "./system-item-types";

/**
 * Production provisioning: system item types plus the demo account and profile.
 * Never writes demo collections, items, tags, or joins.
 */
async function seedProduction(): Promise<void> {
  await seedSystemItemTypes();
  console.log(`Seeded ${SYSTEM_ITEM_TYPES.length} system item types.`);

  const userId = await ensureDemoUser();
  await ensureDemoProfile(userId);
  console.log(`Ensured demo user ${DEMO_USER.email} (free plan, no items).`);
}

seedProduction()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error("Failed to seed production data:", error);
    process.exit(1);
  });
