import { createHash } from "node:crypto";

import { eq, sql } from "drizzle-orm";

import { env } from "../lib/env";

import { DEMO_USER, ensureDemoProfile, ensureDemoUser } from "./demo-account";
import { db } from "./index";
import {
  collections,
  itemCollections,
  itemTags,
  itemTypes,
  items,
  tags,
} from "./schema";
import { SYSTEM_ITEM_TYPES, seedSystemItemTypes } from "./system-item-types";

/**
 * Idempotent development/demo seed (see `@context/features/seed-spec.md`).
 *
 * Safe to run repeatedly and on every deploy: the demo user is created at most
 * once, and every other write is an upsert or an `ON CONFLICT DO NOTHING` no-op.
 */

type SystemTypeKey =
  | "snippet"
  | "prompt"
  | "note"
  | "command"
  | "link"
  | "file"
  | "image";

type SeedItem = {
  /** Stable key used to derive a deterministic item id. */
  key: string;
  type: SystemTypeKey;
  title: string;
  description?: string;
  language?: string;
  content?: string;
  url?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
  /** Tags are normalized (trim + lowercase) and upserted per owner. */
  tags?: string[];
};

type SeedCollection = {
  slug: string;
  name: string;
  description: string;
  isFavorite?: boolean;
  items: SeedItem[];
};

const COLLECTIONS: SeedCollection[] = [
  {
    slug: "react-patterns",
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    items: [
      {
        key: "react-patterns/hooks",
        type: "snippet",
        title: "Custom hooks: useDebounce & useLocalStorage",
        description:
          "Debounce a fast-changing value and persist state to localStorage.",
        language: "typescript",
        tags: ["react", "hooks", "typescript"],
        isPinned: true,
        content: `import { useCallback, useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [stored, setStored] = useState<T>(() => {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : initial;
  });

  const setValue = useCallback(
    (next: T) => {
      setStored(next);
      window.localStorage.setItem(key, JSON.stringify(next));
    },
    [key],
  );

  return [stored, setValue] as const;
}`,
      },
      {
        key: "react-patterns/compound-components",
        type: "snippet",
        title: "Compound components with typed context",
        description:
          "Share state through a typed context and expose a compound component API.",
        language: "tsx",
        tags: ["react", "typescript", "patterns"],
        content: `import { createContext, useContext, useState, type ReactNode } from "react";

type TabsContextValue = { value: string; setValue: (value: string) => void };
const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used within <Tabs>");
  return context;
}

export function Tabs({
  defaultValue,
  children,
}: {
  defaultValue: string;
  children: ReactNode;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      {children}
    </TabsContext.Provider>
  );
}

export function Tab({ id, children }: { id: string; children: ReactNode }) {
  const { value, setValue } = useTabs();
  return (
    <button aria-selected={value === id} onClick={() => setValue(id)}>
      {children}
    </button>
  );
}`,
      },
      {
        key: "react-patterns/utilities",
        type: "snippet",
        title: "React utility helpers",
        description: "cn class merging, composeRefs, and a range helper.",
        language: "typescript",
        tags: ["react", "typescript", "utilities"],
        content: `import type { MutableRefObject, Ref } from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function composeRefs<T>(...refs: Array<Ref<T>>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as MutableRefObject<T | null>).current = node;
    }
  };
}

export const range = (length: number) =>
  Array.from({ length }, (_, index) => index);`,
      },
    ],
  },
  {
    slug: "ai-workflows",
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    isFavorite: true,
    items: [
      {
        key: "ai-workflows/code-review",
        type: "prompt",
        title: "Code review prompt",
        description: "Senior reviewer persona that separates blockers from nits.",
        tags: ["prompt", "review", "ai"],
        isFavorite: true,
        isPinned: true,
        content: `You are a senior engineer reviewing a pull request.

Focus on correctness, security, and readability, in that order. For each finding:
- State the file and line.
- Explain the risk in one sentence.
- Suggest a concrete diff.

Separate blockers from nits, and say explicitly when you find nothing and the change is safe to merge.`,
      },
      {
        key: "ai-workflows/documentation",
        type: "prompt",
        title: "Documentation generation prompt",
        description:
          "Turn source into reference docs with examples and edge cases.",
        tags: ["prompt", "docs", "ai"],
        content: `Write reference documentation for the following code.

Include:
1. A one-paragraph summary of what it does.
2. Its public API: parameters, return values, and thrown errors.
3. A minimal usage example.
4. Edge cases and common mistakes.

Do not invent behavior. If the code is ambiguous, list the open questions instead of guessing.`,
      },
      {
        key: "ai-workflows/refactoring",
        type: "prompt",
        title: "Refactoring assistance prompt",
        description: "Behavior-preserving refactors with an explainable diff.",
        tags: ["prompt", "refactor", "ai"],
        content: `Refactor the following code without changing its behavior.

Constraints:
- Keep the public API identical.
- Preserve existing tests; add tests only when coverage is missing.
- Explain each change briefly and call out any change you are unsure about.

Return the refactored code followed by a short rationale.`,
      },
    ],
  },
  {
    slug: "devops",
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    isFavorite: true,
    items: [
      {
        key: "devops/docker-ci",
        type: "snippet",
        title: "Multi-stage Docker build for CI",
        description:
          "Stage-cached production image used by the GitHub Actions deploy workflow.",
        language: "dockerfile",
        tags: ["docker", "ci", "bun"],
        isFavorite: true,
        content: `# Stage 1: install dependencies (cached unless the lockfile changes)
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 2: build the Next.js app
FROM oven/bun:1 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Stage 3: minimal runtime
FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["bun", "server.js"]`,
      },
      {
        key: "devops/deploy-script",
        type: "command",
        title: "Deployment script",
        description: "Install, migrate, build, and start in one run.",
        language: "bash",
        tags: ["docker", "bash", "deployment"],
        content: `set -euo pipefail

bun install --frozen-lockfile
bun run db:migrate
bun run build
bun run start`,
      },
      {
        key: "devops/docker-docs",
        type: "link",
        title: "Docker documentation",
        description: "Official Docker guides and CLI reference.",
        url: "https://docs.docker.com/",
        tags: ["docker", "docs"],
      },
      {
        key: "devops/github-actions-docs",
        type: "link",
        title: "GitHub Actions documentation",
        description: "Workflow syntax and CI/CD reference.",
        url: "https://docs.github.com/en/actions",
        tags: ["github", "ci", "docs"],
      },
    ],
  },
  {
    slug: "terminal-commands",
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    items: [
      {
        key: "terminal/git",
        type: "command",
        title: "Git operations",
        description: "Inspect history and undo the last commit without losing work.",
        language: "bash",
        tags: ["git", "bash"],
        content: `# Show a compact one-line history
git log --oneline --graph --decorate -20

# Undo the last commit but keep the changes staged
git reset --soft HEAD~1

# Find which commit introduced a string
git log -S "search term" --oneline`,
      },
      {
        key: "terminal/docker",
        type: "command",
        title: "Docker commands",
        description: "Build an image and clean up unused resources.",
        language: "bash",
        tags: ["docker", "bash"],
        content: `# Build and tag an image
docker build -t my-app:latest .

# Remove stopped containers, dangling images, and unused volumes
docker system prune -af --volumes

# Tail logs for a running service
docker compose logs -f app`,
      },
      {
        key: "terminal/process-management",
        type: "command",
        title: "Process management",
        description: "Find and stop whatever is holding a port.",
        language: "bash",
        tags: ["bash", "process"],
        content: `# Show what is listening on a port
lsof -i :3000

# Kill it by PID
kill -9 <PID>

# Or find and kill in one line
lsof -ti :3000 | xargs kill -9`,
      },
      {
        key: "terminal/package-manager",
        type: "command",
        title: "Package manager utilities (bun)",
        description: "Add, update, and audit dependencies with bun.",
        language: "bash",
        tags: ["bun", "bash"],
        isFavorite: true,
        content: `# Add a dependency
bun add zod

# Upgrade dependencies to their latest allowed versions
bun update

# Explain why a package is installed
bun pm ls --all | grep zod`,
      },
    ],
  },
  {
    slug: "design-resources",
    name: "Design Resources",
    description: "UI/UX resources and references",
    items: [
      {
        key: "design/tailwind",
        type: "link",
        title: "Tailwind CSS documentation",
        description: "Utility-first CSS reference and configuration.",
        url: "https://tailwindcss.com/docs",
        tags: ["tailwind", "css", "docs"],
      },
      {
        key: "design/shadcn-ui",
        type: "link",
        title: "shadcn/ui",
        description: "Copy-paste, accessible React components built on Radix.",
        url: "https://ui.shadcn.com/",
        tags: ["ui", "react", "components"],
      },
      {
        key: "design/material",
        type: "link",
        title: "Material Design 3",
        description: "Google's design system guidance and tokens.",
        url: "https://m3.material.io/",
        tags: ["design", "ui"],
      },
      {
        key: "design/lucide",
        type: "link",
        title: "Lucide icons",
        description: "Open-source icon set used across the app.",
        url: "https://lucide.dev/icons/",
        tags: ["icons", "design"],
      },
    ],
  },
];

/** RFC 4122-shaped UUID derived from `key`, so re-runs target the same rows. */
function seededId(key: string): string {
  const hex = createHash("sha256")
    .update(`devgnosis:seed:${key}`)
    .digest("hex");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

/** Resolves the seeded system item type ids by key. */
async function getSystemTypeIds(): Promise<Record<SystemTypeKey, string>> {
  const rows = await db
    .select({ key: itemTypes.key, id: itemTypes.id })
    .from(itemTypes)
    .where(eq(itemTypes.isSystem, true));

  const byKey = new Map(rows.map((row) => [row.key, row.id]));
  const resolve = (key: SystemTypeKey): string => {
    const id = byKey.get(key);
    if (!id) throw new Error(`Missing system item type "${key}".`);
    return id;
  };

  return {
    snippet: resolve("snippet"),
    prompt: resolve("prompt"),
    note: resolve("note"),
    command: resolve("command"),
    link: resolve("link"),
    file: resolve("file"),
    image: resolve("image"),
  };
}

/**
 * Upserts the collections, their items, tags, and the join rows inside a single
 * transaction so the graph stays consistent. Collections conflict on the
 * `(owner_id, slug)` unique index and return their id; items conflict on their
 * deterministic id; tags conflict on `(owner_id, normalized_name)`; joins are
 * inserted with `ON CONFLICT DO NOTHING`.
 */
async function seedCollectionsAndItems(
  userId: string,
  typeIds: Record<SystemTypeKey, string>,
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const collection of COLLECTIONS) {
      const [collectionRow] = await tx
        .insert(collections)
        .values({
          id: seededId(`collection:${collection.slug}`),
          ownerId: userId,
          slug: collection.slug,
          name: collection.name,
          description: collection.description,
          isFavorite: collection.isFavorite ?? false,
        })
        .onConflictDoUpdate({
          target: [collections.ownerId, collections.slug],
          set: {
            name: sql`excluded.name`,
            description: sql`excluded.description`,
            isFavorite: sql`excluded.is_favorite`,
            updatedAt: sql`now()`,
          },
        })
        .returning({ id: collections.id });

      if (!collectionRow) {
        throw new Error(`Failed to upsert collection "${collection.slug}".`);
      }

      for (const item of collection.items) {
        const [itemRow] = await tx
          .insert(items)
          .values({
            id: seededId(`item:${item.key}`),
            ownerId: userId,
            itemTypeId: typeIds[item.type],
            title: item.title,
            description: item.description ?? null,
            content: item.content ?? null,
            url: item.url ?? null,
            language: item.language ?? null,
            isFavorite: item.isFavorite ?? false,
            isPinned: item.isPinned ?? false,
          })
          .onConflictDoUpdate({
            target: items.id,
            set: {
              itemTypeId: sql`excluded.item_type_id`,
              title: sql`excluded.title`,
              description: sql`excluded.description`,
              content: sql`excluded.content`,
              url: sql`excluded.url`,
              language: sql`excluded.language`,
              isFavorite: sql`excluded.is_favorite`,
              isPinned: sql`excluded.is_pinned`,
              updatedAt: sql`now()`,
            },
          })
          .returning({ id: items.id });

        if (!itemRow) {
          throw new Error(`Failed to upsert item "${item.key}".`);
        }

        for (const tag of item.tags ?? []) {
          const name = tag.trim();
          if (!name) continue;

          const [tagRow] = await tx
            .insert(tags)
            .values({ ownerId: userId, name, normalizedName: name.toLowerCase() })
            .onConflictDoUpdate({
              target: [tags.ownerId, tags.normalizedName],
              set: { name: sql`excluded.name` },
            })
            .returning({ id: tags.id });

          if (!tagRow) {
            throw new Error(
              `Failed to upsert tag "${name}" for item "${item.key}".`,
            );
          }

          await tx
            .insert(itemTags)
            .values({ itemId: itemRow.id, tagId: tagRow.id })
            .onConflictDoNothing();
        }

        await tx
          .insert(itemCollections)
          .values({ itemId: itemRow.id, collectionId: collectionRow.id })
          .onConflictDoNothing();
      }
    }
  });
}

/** Host of the configured database, so a seed run names the branch it writes to. */
function describeTarget(): string {
  return (
    process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "unknown host"
  );
}

/** Runs every seed step in order and reports a short summary. */
async function seed(): Promise<void> {
  if (env.NODE_ENV === "production" || process.env.ALLOW_FULL_SEED !== "1") {
    throw new Error(
      [
        `Refusing to run the full demo seed against ${describeTarget()}.`,
        "It writes demo collections and items, which production must not receive.",
        "Production: use `bun run db:seed:production`.",
        "Development or preview, after confirming the target:",
        '  $env:ALLOW_FULL_SEED="1"; bun run db:seed',
      ].join("\n"),
    );
  }

  await seedSystemItemTypes();
  console.log(`Seeded ${SYSTEM_ITEM_TYPES.length} system item types.`);

  const userId = await ensureDemoUser();
  await ensureDemoProfile(userId);
  console.log(`Seeded demo user ${DEMO_USER.email} (free plan).`);

  const typeIds = await getSystemTypeIds();
  await seedCollectionsAndItems(userId, typeIds);

  const itemCount = COLLECTIONS.reduce(
    (total, collection) => total + collection.items.length,
    0,
  );
  console.log(
    `Seeded ${COLLECTIONS.length} collections and ${itemCount} items.`,
  );
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error("Failed to seed demo data:", error);
    process.exit(1);
  });
