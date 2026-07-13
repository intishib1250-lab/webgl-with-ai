import { useCallback, useRef, useState } from "react";

interface AngleDialProps {
  value: number; // degrees, 0..360
  onChange: (value: number, committing: boolean) => void;
  onCommit?: () => void;
}

export function AngleDial({ value, onChange, onCommit }: AngleDialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(String(Math.round(value)));
  const dragging = useRef(false);

  const angleFromEvent = useCallback((clientX: number, clientY: number) => {
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let deg = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    return deg;
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      dragging.current = true;
      (event.target as Element).setPointerCapture(event.pointerId);
      onChange(angleFromEvent(event.clientX, event.clientY), false);
    },
    [angleFromEvent, onChange],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!dragging.current) return;
      const deg = angleFromEvent(event.clientX, event.clientY);
      onChange(deg, false);
      setText(String(Math.round(deg)));
    },
    [angleFromEvent, onChange],
  );

  const onPointerUp = useCallback(() => {
    if (dragging.current) {
      dragging.current = false;
      onCommit?.();
    }
  }, [onCommit]);

  return (
    <div className="flex items-center gap-1.5">
      <div
        ref={dialRef}
        className="relative h-6 w-6 shrink-0 cursor-pointer rounded-full bg-[var(--surface-2)]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          className="absolute left-1/2 top-1/2 h-[6px] w-[1.5px] -translate-x-1/2 -translate-y-full origin-bottom bg-[var(--brand)]"
          style={{ transform: `translateX(-50%) rotate(${value}deg)` }}
        />
        <span className="sr-only">{Math.round(value)} degrees</span>
      </div>
      <input
        className="h-6 w-12 rounded-full bg-[var(--surface-2)] px-2.5 text-2xs-plus tabular-nums text-[var(--text-primary)] outline-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => {
          const parsed = Number(text);
          if (Number.isFinite(parsed)) {
            onChange(((parsed % 360) + 360) % 360, false);
            onCommit?.();
          } else {
            setText(String(Math.round(value)));
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
    </div>
  );
}
