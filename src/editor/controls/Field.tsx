import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex items-center justify-between gap-2 py-1", className)}>
      <span className="text-2xs-plus text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </label>
  );
}

export function Section({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="border-b border-[var(--surface-border)] px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-2xs-plus font-medium uppercase tracking-wide text-[var(--text-tertiary)]">{title}</h3>
        {actions}
      </div>
      <div>{children}</div>
    </div>
  );
}
