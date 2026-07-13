import { useEffect, useState } from "react";
import { Field } from "@/editor/controls/Field";
import { useNumberScrub } from "@/editor/controls/useNumberScrub";

export interface SubField {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function PairField({
  label,
  a,
  b,
  onCommit,
  min = -1000,
  max = 1000,
}: {
  label: string;
  a: SubField;
  b: SubField;
  onCommit: () => void;
  min?: number;
  max?: number;
}) {
  return (
    <Field label={label} className="items-start">
      <div className="flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-3 py-1.5">
        <MiniNumber {...a} min={min} max={max} onCommit={onCommit} />
        <MiniNumber {...b} min={min} max={max} onCommit={onCommit} />
      </div>
    </Field>
  );
}

export function TripleField({
  label,
  a,
  b,
  c,
  onCommit,
  min = -1000,
  max = 1000,
  step = 1,
}: {
  label: string;
  a: SubField;
  b: SubField;
  c: SubField;
  onCommit: () => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label} className="items-start">
      <div className="flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-3 py-1.5">
        <MiniNumber {...a} min={min} max={max} step={step} onCommit={onCommit} />
        <MiniNumber {...b} min={min} max={max} step={step} onCommit={onCommit} />
        <MiniNumber {...c} min={min} max={max} step={step} onCommit={onCommit} />
      </div>
    </Field>
  );
}

export function MiniNumber({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  onCommit,
}: SubField & { min: number; max: number; step?: number; onCommit: () => void }) {
  const [text, setText] = useState(String(Math.round(value * (step < 1 ? 10 : 1)) / (step < 1 ? 10 : 1)));

  useEffect(() => {
    setText(String(Math.round(value * (step < 1 ? 10 : 1)) / (step < 1 ? 10 : 1)));
  }, [value, step]);

  // Every MiniNumber-driven field (Position, Axis, Twist, Light Position, Direction) is unbounded per spec —
  // min/max here only shape drag-scrub sensitivity, they never clamp the committed value.
  const scrub = useNumberScrub({ value, min, max, step, clampMin: -Infinity, clampMax: Infinity, onChange, onCommit });

  return (
    <label className="flex items-center gap-1">
      <span className="text-2xs font-medium text-[var(--axis-accent)]">{label}</span>
      <input
        className="w-10 cursor-ew-resize bg-transparent text-2xs-plus tabular-nums text-foreground outline-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => {
          const parsed = Number(text);
          if (Number.isFinite(parsed)) {
            onChange(parsed);
            onCommit();
          } else {
            setText(String(value));
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        {...scrub}
      />
    </label>
  );
}
