/**
 * Temporary mock data for the dashboard UI.
 *
 * This is a single source of truth for dashboard screens until the database,
 * Drizzle schema, and owner-scoped queries are wired up. It is intentionally
 * a plain data file: no helper functions, no derived values, no fetching.
 * Replace imports of these exports with real query results when available.
 */

export type MockPlan = "free" | "pro";

export type MockContentKind = "text" | "url" | "file";

export type MockItemTypeKey =
  | "snippet"
  | "prompt"
  | "command"
  | "note"
  | "link"
  | "file"
  | "image";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  plan: MockPlan;
  planStatus: "active" | "trialing" | "canceled";
};

export type MockItemType = {
  id: string;
  key: MockItemTypeKey;
  name: string;
  /** Lucide icon name (see project-overview item-type table). */
  icon: string;
  /** Type accent color token used for icons, borders, and tints. */
  color: string;
  contentKind: MockContentKind;
  isSystem: boolean;
  /** Total items of this type, for sidebar counts. */
  itemCount: number;
  /** Pro-only types are locked in the sidebar for free users. */
  isPro: boolean;
};

export type MockCollection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  defaultTypeId: string | null;
  /** Item-type ids represented in this collection, for the card type icons. */
  itemTypeIds: string[];
  /** Total items in this collection, for the card count. */
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type MockItem = {
  id: string;
  itemTypeId: string;
  title: string;
  description: string | null;
  /** Markdown/code/plain text body for text items. */
  content: string | null;
  /** URL for link items. */
  url: string | null;
  language: string | null;
  tags: string[];
  collectionIds: string[];
  isFavorite: boolean;
  isPinned: boolean;
  lastOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MockDashboardStats = {
  totalItems: number;
  totalCollections: number;
  addedThisWeek: number;
  greeting: string;
};

/** The currently signed-in user. */
export const currentUser: MockUser = {
  id: "user_alex",
  name: "Alex",
  email: "alex@devgnosis.dev",
  plan: "pro",
  planStatus: "active",
};

/** System item types, seeded and stable (see project-overview). */
export const itemTypes: MockItemType[] = [
  {
    id: "type_snippet",
    key: "snippet",
    name: "Snippets",
    icon: "CodeXml",
    color: "#3B82F6",
    contentKind: "text",
    isSystem: true,
    itemCount: 128,
    isPro: false,
  },
  {
    id: "type_prompt",
    key: "prompt",
    name: "Prompts",
    icon: "Sparkles",
    color: "#8B5CF6",
    contentKind: "text",
    isSystem: true,
    itemCount: 46,
    isPro: false,
  },
  {
    id: "type_command",
    key: "command",
    name: "Commands",
    icon: "Terminal",
    color: "#F97316",
    contentKind: "text",
    isSystem: true,
    itemCount: 73,
    isPro: false,
  },
  {
    id: "type_note",
    key: "note",
    name: "Notes",
    icon: "StickyNote",
    color: "#FDE047",
    contentKind: "text",
    isSystem: true,
    itemCount: 39,
    isPro: false,
  },
  {
    id: "type_link",
    key: "link",
    name: "Links",
    icon: "Link",
    color: "#10B981",
    contentKind: "url",
    isSystem: true,
    itemCount: 91,
    isPro: false,
  },
  {
    id: "type_file",
    key: "file",
    name: "Files",
    icon: "File",
    color: "#6B7280",
    contentKind: "file",
    isSystem: true,
    itemCount: 12,
    isPro: true,
  },
  {
    id: "type_image",
    key: "image",
    name: "Images",
    icon: "Image",
    color: "#EC4899",
    contentKind: "file",
    isSystem: true,
    itemCount: 24,
    isPro: true,
  },
];

export const collections: MockCollection[] = [
  {
    id: "col_react_patterns",
    slug: "react-patterns",
    name: "React Patterns",
    description: "Hooks, compound components, render patterns",
    isFavorite: false,
    defaultTypeId: "type_snippet",
    itemTypeIds: ["type_snippet"],
    itemCount: 34,
    createdAt: "2026-06-02T09:12:00.000Z",
    updatedAt: "2026-10-15T18:40:00.000Z",
  },
  {
    id: "col_ai_workflows",
    slug: "ai-workflows",
    name: "AI Workflows",
    description: "Reusable prompts for review, refactor & docs",
    isFavorite: true,
    defaultTypeId: "type_prompt",
    itemTypeIds: ["type_prompt", "type_snippet", "type_note"],
    itemCount: 21,
    createdAt: "2026-06-18T14:05:00.000Z",
    updatedAt: "2026-10-14T11:20:00.000Z",
  },
  {
    id: "col_devops_toolkit",
    slug: "devops-toolkit",
    name: "DevOps Toolkit",
    description: "kubectl, docker, terraform one-liners",
    isFavorite: true,
    defaultTypeId: "type_command",
    itemTypeIds: ["type_command", "type_snippet", "type_link"],
    itemCount: 48,
    createdAt: "2026-05-21T08:30:00.000Z",
    updatedAt: "2026-10-16T07:05:00.000Z",
  },
  {
    id: "col_launch_notes",
    slug: "launch-notes",
    name: "Launch Notes",
    description: "Checklists, release notes, post-mortems",
    isFavorite: false,
    defaultTypeId: "type_note",
    itemTypeIds: ["type_note", "type_link", "type_image"],
    itemCount: 12,
    createdAt: "2026-07-09T16:45:00.000Z",
    updatedAt: "2026-10-13T09:15:00.000Z",
  },
];

export const items: MockItem[] = [
  {
    id: "item_rate_limited_fetch",
    itemTypeId: "type_snippet",
    title: "Rate-limited fetch utility",
    description: null,
    content:
      "export async function rateLimitedFetch(url, opts) {\n  await limiter.acquire();\n  return fetch(url, opts);\n}",
    url: null,
    language: "typescript",
    tags: ["typescript", "fetch", "retry"],
    collectionIds: ["col_react_patterns", "col_devops_toolkit"],
    isFavorite: true,
    isPinned: true,
    lastOpenedAt: "2026-10-16T08:10:00.000Z",
    createdAt: "2026-09-28T10:00:00.000Z",
    updatedAt: "2026-10-16T06:30:00.000Z",
  },
  {
    id: "item_deploy_checklist",
    itemTypeId: "type_note",
    title: "Production deployment checklist",
    description: null,
    content:
      "- [x] Run migrations on staging snapshot\n- [ ] Verify feature flags default off\n- [ ] Tag release & update changelog",
    url: null,
    language: null,
    tags: ["release", "ops"],
    collectionIds: ["col_launch_notes", "col_devops_toolkit"],
    isFavorite: false,
    isPinned: true,
    lastOpenedAt: "2026-10-15T17:00:00.000Z",
    createdAt: "2026-08-15T09:00:00.000Z",
    updatedAt: "2026-10-15T12:00:00.000Z",
  },
  {
    id: "item_use_debounced_value",
    itemTypeId: "type_snippet",
    title: "useDebouncedValue hook",
    description: null,
    content:
      "export function useDebouncedValue(value, delay = 300) {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const id = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(id);\n  }, [value, delay]);\n  return debounced;\n}",
    url: null,
    language: "typescript",
    tags: ["react", "hooks"],
    collectionIds: ["col_react_patterns"],
    isFavorite: true,
    isPinned: false,
    lastOpenedAt: "2026-10-15T15:45:00.000Z",
    createdAt: "2026-07-01T10:30:00.000Z",
    updatedAt: "2026-10-12T13:25:00.000Z",
  },
  {
    id: "item_compose_refs",
    itemTypeId: "type_snippet",
    title: "Compose multiple refs",
    description: null,
    content:
      "function composeRefs(...refs) {\n  return (node) =>\n    refs.forEach((ref) => {\n      if (typeof ref === 'function') ref(node);\n      else if (ref) ref.current = node;\n    });\n}",
    url: null,
    language: "typescript",
    tags: ["react", "typescript"],
    collectionIds: ["col_react_patterns"],
    isFavorite: false,
    isPinned: false,
    lastOpenedAt: "2026-10-11T09:20:00.000Z",
    createdAt: "2026-06-24T08:15:00.000Z",
    updatedAt: "2026-09-30T14:10:00.000Z",
  },
  {
    id: "item_code_review_prompt",
    itemTypeId: "type_prompt",
    title: "Code review system prompt",
    description: "Senior reviewer persona for pull-request passes",
    content:
      "You are a senior engineer reviewing a pull request. Prioritize correctness, security, and readability. Call out nits separately from blockers, and suggest concrete diffs.",
    url: null,
    language: null,
    tags: ["prompt", "review"],
    collectionIds: ["col_ai_workflows"],
    isFavorite: true,
    isPinned: false,
    lastOpenedAt: "2026-10-16T07:50:00.000Z",
    createdAt: "2026-07-20T11:00:00.000Z",
    updatedAt: "2026-10-09T16:30:00.000Z",
  },
  {
    id: "item_refactor_prompt",
    itemTypeId: "type_prompt",
    title: "Refactor assistant",
    description: null,
    content:
      "Refactor the following code without changing behavior. Explain each change briefly and keep the public API identical.",
    url: null,
    language: null,
    tags: ["prompt", "refactor"],
    collectionIds: ["col_ai_workflows"],
    isFavorite: false,
    isPinned: false,
    lastOpenedAt: "2026-10-13T10:05:00.000Z",
    createdAt: "2026-07-22T09:40:00.000Z",
    updatedAt: "2026-09-18T12:00:00.000Z",
  },
  {
    id: "item_kubectl_rollout",
    itemTypeId: "type_command",
    title: "Restart a deployment",
    description: null,
    content: "kubectl rollout restart deployment/$DEPLOYMENT -n $NAMESPACE",
    url: null,
    language: "bash",
    tags: ["kubernetes", "kubectl"],
    collectionIds: ["col_devops_toolkit"],
    isFavorite: true,
    isPinned: false,
    lastOpenedAt: "2026-10-14T08:55:00.000Z",
    createdAt: "2026-05-30T13:20:00.000Z",
    updatedAt: "2026-10-08T09:35:00.000Z",
  },
  {
    id: "item_docker_prune",
    itemTypeId: "type_command",
    title: "Prune all unused docker data",
    description: null,
    content: "docker system prune -af --volumes",
    url: null,
    language: "bash",
    tags: ["docker"],
    collectionIds: ["col_devops_toolkit"],
    isFavorite: false,
    isPinned: false,
    lastOpenedAt: "2026-10-10T19:10:00.000Z",
    createdAt: "2026-05-28T07:45:00.000Z",
    updatedAt: "2026-09-25T11:15:00.000Z",
  },
  {
    id: "item_release_postmortem",
    itemTypeId: "type_note",
    title: "Release 1.4 post-mortem",
    description: null,
    content:
      "What went well: staged rollout caught the cache bug early.\nWhat to improve: tighten the migration dry-run step and add a rollback drill.",
    url: null,
    language: null,
    tags: ["postmortem", "release"],
    collectionIds: ["col_launch_notes"],
    isFavorite: false,
    isPinned: false,
    lastOpenedAt: "2026-10-12T16:40:00.000Z",
    createdAt: "2026-07-14T10:00:00.000Z",
    updatedAt: "2026-10-02T15:20:00.000Z",
  },
  {
    id: "item_next_caching_guide",
    itemTypeId: "type_link",
    title: "Next.js caching guide",
    description: "Docs on use cache, cacheLife and cacheTag",
    content: null,
    url: "https://nextjs.org/docs/app/getting-started/caching",
    language: null,
    tags: ["nextjs", "cache"],
    collectionIds: ["col_devops_toolkit"],
    isFavorite: false,
    isPinned: false,
    lastOpenedAt: "2026-10-15T09:30:00.000Z",
    createdAt: "2026-06-11T12:10:00.000Z",
    updatedAt: "2026-09-19T08:00:00.000Z",
  },
];

export const dashboardStats: MockDashboardStats = {
  totalItems: 413,
  totalCollections: 9,
  addedThisWeek: 6,
  greeting: "Good morning",
};
