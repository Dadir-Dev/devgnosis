import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type SectionHeadingProps = {
  icon: LucideIcon;
  children: ReactNode;
  /** Optional trailing control, e.g. a "View all" link. */
  action?: ReactNode;
};

/** Icon + title row used to head each dashboard main-area section. */
export function SectionHeading({ icon: Icon, children, action }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
      <h2 className="text-sm font-medium">{children}</h2>
      {action ? <div className="ml-auto">{action}</div> : null}
    </div>
  );
}
