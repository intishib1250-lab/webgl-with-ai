import {
  Blend,
  CircleDashed,
  CircleDot,
  Droplet,
  Grid2x2,
  Grid3x3,
  type LucideIcon,
  Move3d,
  MousePointer2,
  Radio,
  Rainbow,
  Sparkles,
  Sun,
  Terminal,
  Waves,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EFFECT_DEFINITIONS } from "@/effects/registry";
import { EffectCategory } from "@/effects/types";
import { cn } from "@/lib/utils";

const EFFECT_ICON: Record<string, LucideIcon> = {
  noise: CircleDashed,
  wave: Waves,
  liquid: Droplet,
  ripple: Radio,
  chromaticAberration: Rainbow,
  blur: Blend,
  pixelate: Grid3x3,
  halftone: CircleDot,
  ascii: Terminal,
  dither: Grid2x2,
  bloom: Sun,
  displacement: Move3d,
  mouseFollow: MousePointer2,
};

const CATEGORY_LABEL: Record<EffectCategory, string> = {
  distort: "Distort",
  stylize: "Stylize",
  blur: "Blur & Glow",
  color: "Color",
};

const CATEGORIES: EffectCategory[] = ["distort", "stylize", "blur", "color"];

export function EffectBrowser({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (effectId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<EffectCategory | "all">("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return EFFECT_DEFINITIONS.filter((def) => {
      if (category !== "all" && def.category !== category) return false;
      if (query && !def.label.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [search, category]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setSearch("");
      }}
    >
      <DialogContent className="flex h-[36rem] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Sparkles size={15} className="text-[var(--brand)]" /> Add effect layer
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          <div className="w-40 shrink-0 border-r border-border p-2">
            <CategoryItem label="Featured" active={category === "all"} onClick={() => setCategory("all")} />
            {CATEGORIES.map((cat) => (
              <CategoryItem key={cat} label={CATEGORY_LABEL[cat]} active={category === cat} onClick={() => setCategory(cat)} />
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-border p-3">
              <Input
                autoFocus
                placeholder="Search effects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {filtered.length === 0 && (
                <p className="py-10 text-center text-2xs-plus text-muted-foreground">No effects found</p>
              )}
              <div className="grid grid-cols-3 gap-2.5">
                {filtered.map((def) => {
                  const Icon = EFFECT_ICON[def.id] ?? Sparkles;
                  return (
                    <button
                      key={def.id}
                      className={cn(
                        "group flex flex-col items-center gap-2 rounded-lg border border-border bg-[var(--surface-1)] p-3 text-left transition-colors hover:border-[var(--brand)] hover:bg-[var(--surface-2)]",
                      )}
                      onClick={() => {
                        onPick(def.id);
                        onOpenChange(false);
                        setSearch("");
                      }}
                    >
                      <div className="grid aspect-square w-full place-items-center rounded-md bg-[var(--surface-2)] text-muted-foreground transition-colors group-hover:text-[var(--brand)]">
                        <Icon size={28} strokeWidth={1.5} />
                      </div>
                      <div className="w-full">
                        <div className="truncate text-2xs-plus font-medium text-foreground">{def.label}</div>
                        <div className="text-2xs text-muted-foreground">{CATEGORY_LABEL[def.category]}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CategoryItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={cn(
        "w-full rounded-md px-2.5 py-1.5 text-left text-2xs-plus transition-colors",
        active ? "bg-[var(--surface-2)] text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
