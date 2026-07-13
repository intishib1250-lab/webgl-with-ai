import {
  Asterisk,
  Box,
  Boxes,
  Circle,
  Combine,
  Cone,
  Cylinder,
  Disc,
  Disc3,
  FileImage,
  Gem,
  Hexagon,
  type LucideIcon,
  Octagon,
  Pill,
  Plus,
  Pyramid,
  Spline,
  Squircle,
  SquareAsterisk,
  Star,
  Torus,
  Triangle,
  Waves,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MODEL3D_LABEL } from "@/core/scene-defaults";
import { Model3DPrimitive } from "@/core/scene-types";
import { cn } from "@/lib/utils";

const MODEL3D_ICON: Record<Model3DPrimitive, LucideIcon> = {
  torus: Torus,
  box: Box,
  sphere: Circle,
  capsule: Pill,
  disc: Disc,
  cylinder: Cylinder,
  octahedron: Octagon,
  hexPrism: Hexagon,
  plus: Plus,
  spring: Spline,
  tricylinder: Combine,
  triangle: Triangle,
  roundedCross: SquareAsterisk,
  roundedBox: Squircle,
  mergedDiscs: Disc3,
  rippledSphere: Waves,
  top: Cone,
  star: Star,
  pyramid: Pyramid,
  asterisk: Asterisk,
  dodecahedron: Gem,
  boxFrame: Boxes,
  custom: FileImage,
};

const MODEL3D_OPTIONS: { primitive: Model3DPrimitive; label: string; icon: LucideIcon }[] = (
  Object.keys(MODEL3D_LABEL) as Model3DPrimitive[]
).map((primitive) => ({ primitive, label: MODEL3D_LABEL[primitive], icon: MODEL3D_ICON[primitive] }));

export function Model3DBrowser({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (primitive: Model3DPrimitive) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return MODEL3D_OPTIONS;
    return MODEL3D_OPTIONS.filter((opt) => opt.label.toLowerCase().includes(query));
  }, [search]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setSearch("");
      }}
    >
      <DialogContent className="flex h-[34rem] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Box size={15} className="text-[var(--brand)]" /> Add 3D model
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          <div className="w-32 shrink-0 border-r border-border p-2">
            <div className="w-full rounded-md bg-[var(--surface-2)] px-2.5 py-1.5 text-left text-2xs-plus text-foreground">SDF</div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-border p-3">
              <Input
                autoFocus
                placeholder="Search models…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {filtered.length === 0 && <p className="py-10 text-center text-2xs-plus text-muted-foreground">No models found</p>}
              <div className="grid grid-cols-4 gap-2.5">
                {filtered.map(({ primitive, label, icon: Icon }) => (
                  <button
                    key={primitive}
                    className={cn(
                      "group flex flex-col items-center gap-2 rounded-lg border border-border bg-[var(--surface-1)] p-3 text-left transition-colors hover:border-[var(--brand)] hover:bg-[var(--surface-2)]",
                    )}
                    onClick={() => {
                      onPick(primitive);
                      onOpenChange(false);
                      setSearch("");
                    }}
                  >
                    <div className="grid aspect-square w-full place-items-center rounded-md bg-[var(--surface-2)] text-muted-foreground transition-colors group-hover:text-[var(--brand)]">
                      <Icon size={26} strokeWidth={1.25} />
                    </div>
                    <div className="w-full truncate text-2xs-plus font-medium text-foreground">{label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
