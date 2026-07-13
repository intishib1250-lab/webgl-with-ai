import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EFFECT_DEFINITIONS } from "@/effects/registry";

const CATEGORY_LABEL: Record<string, string> = {
  distort: "Distort",
  stylize: "Stylize",
  blur: "Blur & Glow",
  color: "Color",
};

export function AddEffectPicker({ onPick }: { onPick: (effectId: string) => void }) {
  const [open, setOpen] = useState(false);
  const categories = Array.from(new Set(EFFECT_DEFINITIONS.map((d) => d.category)));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-2xs-plus">
          <Plus size={12} />
          Add effect
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-0">
        <Command loop>
          <CommandInput placeholder="Search effects…" />
          <CommandList className="max-h-64">
            <CommandEmpty>No effects found</CommandEmpty>
            {categories.map((category) => (
              <CommandGroup key={category} heading={CATEGORY_LABEL[category] ?? category}>
                {EFFECT_DEFINITIONS.filter((d) => d.category === category).map((def) => (
                  <CommandItem
                    key={def.id}
                    value={def.label}
                    onSelect={() => {
                      onPick(def.id);
                      setOpen(false);
                    }}
                  >
                    {def.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
