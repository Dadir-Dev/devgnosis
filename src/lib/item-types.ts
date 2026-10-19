import {
  CodeXml,
  File as FileIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Shapes,
  Sparkles,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";

import { itemTypes, type MockItemType } from "@/lib/mock-data";
import type { SystemItemTypeKey } from "@/lib/system-item-types";

const SYSTEM_TYPE_ICONS = {
  snippet: CodeXml,
  prompt: Sparkles,
  note: StickyNote,
  command: Terminal,
  link: LinkIcon,
  file: FileIcon,
  image: ImageIcon,
} satisfies Record<SystemItemTypeKey, LucideIcon>;

/**
 * Lucide icon per item type key (see project-overview's type table). Typed as a
 * plain string record because database `key` values are strings; callers fall
 * back to `FALLBACK_TYPE_ICON` for an unknown or omitted key.
 */
export const TYPE_ICONS: Readonly<Record<string, LucideIcon>> = SYSTEM_TYPE_ICONS;

/** Icon used when a type key has no mapping (e.g. a future custom type). */
export const FALLBACK_TYPE_ICON: LucideIcon = Shapes;

const ITEM_TYPES_BY_ID = new Map(itemTypes.map((type) => [type.id, type]));

/** Resolve a mock item type by id; undefined for null or unknown ids. */
export function getItemTypeById(id: string | null): MockItemType | undefined {
  return id ? ITEM_TYPES_BY_ID.get(id) : undefined;
}
