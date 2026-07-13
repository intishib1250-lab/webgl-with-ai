import { useMemo, useRef } from "react";

interface NumberScrubOptions {
  value: number;
  min: number;
  max: number;
  step: number;
  /** Overrides `min`/`max` for the final clamp only — `min`/`max` still drive drag sensitivity. Pass ±Infinity to allow unbounded/overflow values. */
  clampMin?: number;
  clampMax?: number;
  onChange: (value: number) => void;
  onCommit: () => void;
}

const DRAG_THRESHOLD_PX = 3;
const FULL_RANGE_DRAG_PX = 200;

/** Drag-to-scrub behavior for numeric inputs, Blender/After-Effects style: pointer-down + move changes the value, a plain click still focuses the field for typing. */
export function useNumberScrub({ value, min, max, step, clampMin, clampMax, onChange, onCommit }: NumberScrubOptions) {
  const stateRef = useRef<{ startX: number; startValue: number; dragging: boolean } | null>(null);
  const lo = clampMin ?? min;
  const hi = clampMax ?? max;

  const sensitivity = useMemo(() => {
    const range = Number.isFinite(max - min) ? max - min : 0;
    return range > 0 ? range / FULL_RANGE_DRAG_PX : step;
  }, [min, max, step]);

  const handlers = {
    onPointerDown: (e: React.PointerEvent<HTMLInputElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      stateRef.current = { startX: e.clientX, startValue: value, dragging: false };
    },
    onPointerMove: (e: React.PointerEvent<HTMLInputElement>) => {
      const state = stateRef.current;
      if (!state) return;
      const dx = e.clientX - state.startX;
      if (!state.dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
        state.dragging = true;
        document.body.style.cursor = "ew-resize";
        document.body.style.userSelect = "none";
      }
      const scale = e.shiftKey ? sensitivity / 10 : sensitivity;
      const raw = state.startValue + dx * scale;
      const stepped = Math.round(raw / step) * step;
      onChange(Math.min(hi, Math.max(lo, stepped)));
    },
    onPointerUp: (e: React.PointerEvent<HTMLInputElement>) => {
      const state = stateRef.current;
      if (!state) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (state.dragging) {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        onCommit();
      } else {
        e.currentTarget.focus();
        e.currentTarget.select();
      }
      stateRef.current = null;
    },
  };

  return handlers;
}
