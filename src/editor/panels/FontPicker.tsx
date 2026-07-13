import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CURATED_FONTS, ensureFontLoaded } from "@/lib/fonts";

export function FontPicker({ value, onChange }: { value: string; onChange: (family: string) => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    for (const font of CURATED_FONTS) ensureFontLoaded(font.family);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-36 justify-between text-2xs-plus"
          style={{ fontFamily: `"${value}", sans-serif` }}
        >
          {value}
          <ChevronDown size={12} className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-0">
        <Command loop>
          <CommandInput placeholder="Search fonts…" />
          <CommandList className="max-h-64">
            <CommandEmpty>No fonts found</CommandEmpty>
            {CURATED_FONTS.map((font) => (
              <CommandItem
                key={font.family}
                value={font.family}
                onSelect={() => {
                  onChange(font.family);
                  setOpen(false);
                }}
                style={{ fontFamily: `"${font.family}", sans-serif` }}
                className="text-sm"
              >
                {font.family}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
