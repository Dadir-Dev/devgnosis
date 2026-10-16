import {
  CodeXml,
  File as FileIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";

import { itemTypes, type MockItemType, type MockItemTypeKey } from "@/lib/mock-data";

/** Lucide icon per system item type (see project-overview's type table). */
export const TYPE_ICONS: Record<MockItemTypeKey, LucideIcon> = {
  snippet: CodeXml,
  prompt: Sparkles,
  command: Terminal,
  note: StickyNote,
  link: LinkIcon,
  file: FileIcon,
  image: ImageIcon,
};

const ITEM_TYPES_BY_ID = new Map(itemTypes.map((type) => [type.id, type]));

/** Resolve an item type by id; undefined for null or unknown ids. */
export function getItemTypeById(id: string | null): MockItemType | undefined {
  return id ? ITEM_TYPES_BY_ID.get(id) : undefined;
}
