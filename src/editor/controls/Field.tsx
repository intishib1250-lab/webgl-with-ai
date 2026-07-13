import { Minus, Plus } from "lucide-react";
import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex items-center justify-between gap-2 py-1.5", className)}>
      <span className="text-2xs-plus text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </label>
  );
}

export function Section({
  title,
  children,
  actions,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--surface-border)] px-3 py-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs-plus font-semibold text-[var(--text-primary)]">{title}</h3>
        <div className="flex items-center gap-1">
          {actions}
          <button
            type="button"
            className="grid size-5 place-items-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            aria-expanded={open}
          >
            {open ? <Minus size={13} /> : <Plus size={13} />}
          </button>
        </div>
      </div>
      {open && <div className="mt-2.5">{children}</div>}
    </div>
  );
}
