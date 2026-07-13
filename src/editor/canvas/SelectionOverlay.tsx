import { useCallback, useRef } from "react";
import { EffectLayer, Layer } from "@/core/scene-types";
import { useEditorStore } from "@/state/store";

type SelectableLayer = Exclude<Layer, EffectLayer>;

interface SelectionOverlayProps {
  layer: SelectableLayer;
  zoom: number;
  artboardRef: React.RefObject<HTMLDivElement | null>;
}

type DragMode = "move" | "scale" | "rotate";

const CORNERS: Array<{ key: string; x: number; y: number; cursor: string }> = [
  { key: "tl", x: -1, y: -1, cursor: "nwse-resize" },
  { key: "tr", x: 1, y: -1, cursor: "nesw-resize" },
  { key: "bl", x: -1, y: 1, cursor: "nesw-resize" },
  { key: "br", x: 1, y: 1, cursor: "nwse-resize" },
];

export function SelectionOverlay({ layer, zoom, artboardRef }: SelectionOverlayProps) {
  const updateLayerTransform = useEditorStore((s) => s.updateLayerTransform);
  const commitHistory = useEditorStore((s) => s.commitHistory);
  const dragState = useRef<{
    mode: DragMode;
    startClientX: number;
    startClientY: number;
    startTransform: SelectableLayer["transform"];
    startDistance: number;
    startAngle: number;
  } | null>(null);

  const sceneFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const rect = artboardRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
    },
    [artboardRef, zoom],
  );

  const onPointerDown = useCallback(
    (mode: DragMode) => (event: React.PointerEvent) => {
      if (layer.locked) return;
      event.stopPropagation();
      (event.target as Element).setPointerCapture(event.pointerId);
      const scenePoint = sceneFromClient(event.clientX, event.clientY);
      const dx = scenePoint.x - layer.transform.x;
      const dy = scenePoint.y - layer.transform.y;
      dragState.current = {
        mode,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startTransform: { ...layer.transform },
        startDistance: Math.hypot(dx, dy) || 1,
        startAngle: (Math.atan2(dy, dx) * 180) / Math.PI,
      };
    },
    [layer.locked, layer.transform, sceneFromClient],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const drag = dragState.current;
      if (!drag) return;

      if (drag.mode === "move") {
        const deltaX = (event.clientX - drag.startClientX) / zoom;
        const deltaY = (event.clientY - drag.startClientY) / zoom;
        updateLayerTransform(
          layer.id,
          { x: drag.startTransform.x + deltaX, y: drag.startTransform.y + deltaY },
          true,
        );
        return;
      }

      const scenePoint = sceneFromClient(event.clientX, event.clientY);
      const dx = scenePoint.x - drag.startTransform.x;
      const dy = scenePoint.y - drag.startTransform.y;

      if (drag.mode === "scale") {
        const distance = Math.hypot(dx, dy) || 1;
        const nextScale = Math.max(0.05, drag.startTransform.scale * (distance / drag.startDistance));
        updateLayerTransform(layer.id, { scale: nextScale }, true);
        return;
      }

      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const nextRotation = drag.startTransform.rotationDeg + (angle - drag.startAngle);
      updateLayerTransform(layer.id, { rotationDeg: nextRotation }, true);
    },
    [layer.id, sceneFromClient, updateLayerTransform, zoom],
  );

  const onPointerUp = useCallback(() => {
    if (dragState.current) {
      dragState.current = null;
      commitHistory();
    }
  }, [commitHistory]);

  const width = layer.width * layer.transform.scale;
  const height = layer.height * layer.transform.scale;

  return (
    <div
      className="absolute"
      style={{
        left: layer.transform.x,
        top: layer.transform.y,
        transform: `rotate(${layer.transform.rotationDeg}deg)`,
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className="absolute cursor-move border"
        style={{
          left: -width / 2,
          top: -height / 2,
          width,
          height,
          borderColor: "var(--brand)",
          borderWidth: 1.5 / zoom,
        }}
        onPointerDown={onPointerDown("move")}
      >
        {CORNERS.map((corner) => (
          <div
            key={corner.key}
            className="absolute rounded-full bg-[var(--brand)]"
            style={{
              left: `calc(${(corner.x + 1) * 50}% - ${5 / zoom}px)`,
              top: `calc(${(corner.y + 1) * 50}% - ${5 / zoom}px)`,
              width: 10 / zoom,
              height: 10 / zoom,
              cursor: corner.cursor,
              boxShadow: "0 0 0 1.5px var(--surface-0)",
            }}
            onPointerDown={onPointerDown("scale")}
          />
        ))}
        <div
          className="absolute rounded-full bg-[var(--brand)]"
          style={{
            left: `calc(50% - ${5 / zoom}px)`,
            top: -28 / zoom,
            width: 10 / zoom,
            height: 10 / zoom,
            cursor: "grab",
            boxShadow: "0 0 0 1.5px var(--surface-0)",
          }}
          onPointerDown={onPointerDown("rotate")}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: -28 / zoom, width: 1.5 / zoom, height: 28 / zoom, background: "var(--brand)" }}
        />
      </div>
    </div>
  );
}
