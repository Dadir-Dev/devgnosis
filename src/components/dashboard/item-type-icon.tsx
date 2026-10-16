import { TYPE_ICONS } from "@/lib/item-types";
import type { MockItemType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type ItemTypeIconProps = {
  type?: MockItemType;
  className?: string;
};

/**
 * Tinted square holding an item type's icon. The background and icon color come
 * from the type's product color token, the documented inline-style exception.
 */
export function ItemTypeIcon({ type, className }: ItemTypeIconProps) {
  if (!type) return null;

  const Icon = TYPE_ICONS[type.key];

  return (
    <span
      aria-hidden="true"
      className={cn("grid size-7 shrink-0 place-items-center rounded-md", className)}
      style={{ backgroundColor: `${type.color}1a`, color: type.color }}
    >
      <Icon className="size-4" />
    </span>
  );
}
