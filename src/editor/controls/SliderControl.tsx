import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { useNumberScrub } from "@/editor/controls/useNumberScrub";

interface SliderControlProps {
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  /** Lets the number box (typing + drag-scrub) exceed the slider's visual [min, max] track. Pass ±Infinity for fully unbounded entry. */
  clampMin?: number;
  clampMax?: number;
  onChange: (value: number, committing: boolean) => void;
  onCommit?: () => void;
}

export function SliderControl({ value, min, max, step, suffix, clampMin, clampMax, onChange, onCommit }: SliderControlProps) {
  const [text, setText] = useState(formatValue(value, step));
  const lo = clampMin ?? min;
  const hi = clampMax ?? max;

  useEffect(() => {
    setText(formatValue(value, step));
  }, [value, step]);

  const scrub = useNumberScrub({
    value,
    min,
    max,
    step,
    clampMin: lo,
    clampMax: hi,
    onChange: (v) => onChange(v, false),
    onCommit: () => onCommit?.(),
  });

  return (
    <div className="flex w-36 items-center gap-2">
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v, false)}
        onValueCommit={() => onCommit?.()}
        className="flex-1"
      />
      <div className="flex w-14 items-center rounded-sm border border-input bg-[var(--surface-1)] px-1">
        <input
          className="w-full cursor-ew-resize bg-transparent text-right text-2xs-plus tabular-nums text-foreground outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={() => commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          {...scrub}
        />
        {suffix && <span className="pl-0.5 text-2xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );

  function commit() {
    const parsed = Number(text);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(hi, Math.max(lo, parsed));
      onChange(clamped, false);
      onCommit?.();
    } else {
      setText(formatValue(value, step));
    }
  }
}

function formatValue(value: number, step: number): string {
  const decimals = step < 1 ? Math.min(3, (step.toString().split(".")[1] ?? "").length) : 0;
  return value.toFixed(decimals);
}
