import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface SelectControlProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function SelectControl({ value, options, onChange }: SelectControlProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-28 rounded-full bg-[var(--surface-2)] text-2xs-plus">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface SegmentedControlProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function SegmentedControl({ value, options, onChange }: SegmentedControlProps) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
      className="rounded-full bg-[var(--surface-2)] p-0.5"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="rounded-full px-2.5 text-2xs-plus font-medium text-[var(--text-secondary)] data-[state=on]:bg-[var(--brand)] data-[state=on]:text-white"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
