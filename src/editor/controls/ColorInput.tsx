import { useEffect, useState } from "react";
import { hexToRgbaArray, rgbaArrayToHex } from "@/core/fill-glsl";

interface ColorInputProps {
  value: string; // #rrggbbaa
  onChange: (value: string, committing: boolean) => void;
  onCommit?: () => void;
}

export function ColorInput({ value, onChange, onCommit }: ColorInputProps) {
  const [rgba] = useStableRgba(value);
  const [r, g, b, a] = rgba;
  const rgbHex = rgbaArrayToHex([r, g, b, 1]).slice(0, 7);

  return (
    <div className="flex items-center gap-1.5">
      <label
        className="relative h-5 w-5 shrink-0 cursor-pointer overflow-hidden rounded-md border border-[var(--surface-border-strong)]"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #3a3a3e 25%, transparent 25%), linear-gradient(-45deg, #3a3a3e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #3a3a3e 75%), linear-gradient(-45deg, transparent 75%, #3a3a3e 75%)",
          backgroundSize: "6px 6px",
          backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
        }}
      >
        <span className="absolute inset-0" style={{ backgroundColor: `rgba(${r * 255},${g * 255},${b * 255},${a})` }} />
        <input
          type="color"
          value={rgbHex}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={(e) => onChange(hexWithAlpha(e.target.value, a), false)}
          onBlur={() => onCommit?.()}
        />
      </label>
      <input
        className="h-6 w-16 rounded-full bg-[var(--surface-2)] px-2.5 text-2xs-plus tabular-nums text-[var(--text-primary)] outline-none"
        value={rgbHex}
        onChange={(e) => onChange(hexWithAlpha(e.target.value, a), false)}
        onBlur={() => onCommit?.()}
      />
    </div>
  );
}

function hexWithAlpha(rgbHex: string, alpha: number): string {
  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${rgbHex}${alphaHex}`;
}

function useStableRgba(value: string): [[number, number, number, number]] {
  const [rgba, setRgba] = useState(() => hexToRgbaArray(value));
  useEffect(() => setRgba(hexToRgbaArray(value)), [value]);
  return [rgba];
}
