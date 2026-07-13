import { useCallback, useEffect, useRef, useState } from "react";
import { hitTestLayers } from "@/core/hit-test";
import { loadAssetImageElement, readFileAsImageAsset } from "@/lib/image-asset";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/state/store";
import { SelectionOverlay } from "./SelectionOverlay";
import { useRenderLoop } from "./useRenderLoop";

export function CanvasViewport() {
  const scene = useEditorStore((s) => s.scene);
  const mode = useEditorStore((s) => s.mode);
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setPan = useEditorStore((s) => s.setPan);
  const selectLayer = useEditorStore((s) => s.selectLayer);
  const addImageLayerFromAsset = useEditorStore((s) => s.addImageLayerFromAsset);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pasteboardRef = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const { rendererRef, updateMouse, requestRender } = useRenderLoop(canvasRef);

  const [isPanning, setIsPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const panDragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);

  const selectedLayerRaw = scene.layers.find((l) => l.id === selectedLayerId) ?? null;
  const selectedLayer = selectedLayerRaw && selectedLayerRaw.type !== "effect" ? selectedLayerRaw : null;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setSpaceHeld(true);
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") setSpaceHeld(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Sync image asset textures into the renderer whenever assets change.
  useEffect(() => {
    let cancelled = false;
    async function sync() {
      const renderer = rendererRef.current;
      if (!renderer) return;
      for (const asset of scene.assets) {
        try {
          const image = await loadAssetImageElement(asset);
          if (!cancelled) {
            renderer.syncAsset(asset, image);
            requestRender();
          }
        } catch {
          // ignore decode failures for now; layer simply renders empty
        }
      }
    }
    sync();
    return () => {
      cancelled = true;
    };
  }, [scene.assets, rendererRef, requestRender]);

  const fitToView = useCallback(() => {
    const container = pasteboardRef.current;
    if (!container) return;
    const padding = 64;
    const availableW = container.clientWidth - padding * 2;
    const availableH = container.clientHeight - padding * 2;
    const next = Math.min(4, Math.max(0.1, Math.min(availableW / scene.size.width, availableH / scene.size.height)));
    setZoom(next);
    setPan((container.clientWidth - scene.size.width * next) / 2, (container.clientHeight - scene.size.height * next) / 2);
  }, [scene.size.height, scene.size.width, setPan, setZoom]);

  useEffect(() => {
    fitToView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== "play") return;
    const container = pasteboardRef.current;
    if (!container) return;
    const next = Math.min(container.clientWidth / scene.size.width, container.clientHeight / scene.size.height);
    setZoom(next);
    setPan((container.clientWidth - scene.size.width * next) / 2, (container.clientHeight - scene.size.height * next) / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const onWheel = useCallback(
    (event: React.WheelEvent) => {
      const container = pasteboardRef.current;
      if (!container) return;
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const rect = container.getBoundingClientRect();
        const cursorX = event.clientX - rect.left;
        const cursorY = event.clientY - rect.top;
        const nextZoom = Math.min(4, Math.max(0.1, zoom * Math.exp(-event.deltaY * 0.0015)));
        const nextPanX = cursorX - (cursorX - panX) * (nextZoom / zoom);
        const nextPanY = cursorY - (cursorY - panY) * (nextZoom / zoom);
        setZoom(nextZoom);
        setPan(nextPanX, nextPanY);
      } else {
        setPan(panX - event.deltaX, panY - event.deltaY);
      }
    },
    [panX, panY, setPan, setZoom, zoom],
  );

  const onPasteboardPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (spaceHeld || event.button === 1) {
        setIsPanning(true);
        panDragRef.current = { startX: event.clientX, startY: event.clientY, startPanX: panX, startPanY: panY };
        (event.target as Element).setPointerCapture(event.pointerId);
        return;
      }
      if (event.target === artboardRef.current || event.currentTarget === event.target) {
        selectLayer(null);
      }
    },
    [panX, panY, selectLayer, spaceHeld],
  );

  const sceneFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const rect = artboardRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
    },
    [zoom],
  );

  const onPasteboardPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (isPanning && panDragRef.current) {
        const drag = panDragRef.current;
        setPan(drag.startPanX + (event.clientX - drag.startX), drag.startPanY + (event.clientY - drag.startY));
        return;
      }
      const scenePoint = sceneFromClient(event.clientX, event.clientY);
      updateMouse({
        x: Math.min(1, Math.max(0, scenePoint.x / scene.size.width)),
        y: 1 - Math.min(1, Math.max(0, scenePoint.y / scene.size.height)),
      });
    },
    [isPanning, scene.size.height, scene.size.width, sceneFromClient, setPan, updateMouse],
  );

  const onPasteboardPointerUp = useCallback(() => {
    setIsPanning(false);
    panDragRef.current = null;
  }, []);

  const onArtboardClick = useCallback(
    (event: React.MouseEvent) => {
      if (spaceHeld) return;
      const scenePoint = sceneFromClient(event.clientX, event.clientY);
      const hit = hitTestLayers(scene, scenePoint);
      selectLayer(hit?.id ?? null);
    },
    [scene, sceneFromClient, selectLayer, spaceHeld],
  );

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);
      const files = Array.from(event.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
      for (const file of files) {
        const asset = await readFileAsImageAsset(file);
        addImageLayerFromAsset(asset);
      }
    },
    [addImageLayerFromAsset],
  );

  const showChrome = mode === "edit";

  return (
    <div
      ref={pasteboardRef}
      className={cn(
        "relative h-full w-full overflow-hidden bg-[var(--surface-0)]",
        spaceHeld && "cursor-grab",
        isPanning && "cursor-grabbing",
      )}
      style={
        showChrome
          ? {
              backgroundImage:
                "radial-gradient(color-mix(in oklab, var(--text-primary) 6%, transparent) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }
          : undefined
      }
      onWheel={onWheel}
      onPointerDown={onPasteboardPointerDown}
      onPointerMove={onPasteboardPointerMove}
      onPointerUp={onPasteboardPointerUp}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}
      >
        <div
          ref={artboardRef}
          className={cn("relative overflow-hidden", showChrome && "shadow-[0_0_0_1px_var(--surface-border-strong)]")}
          style={{ width: scene.size.width, height: scene.size.height }}
          onClick={onArtboardClick}
        >
          <canvas ref={canvasRef} className="block h-full w-full" style={{ imageRendering: "auto" }} />
          {showChrome && selectedLayer && <SelectionOverlay layer={selectedLayer} zoom={zoom} artboardRef={artboardRef} />}
        </div>
      </div>

      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center border-2 border-dashed border-[var(--brand)] bg-[var(--brand)]/5">
          <span className="rounded-md bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text-primary)]">
            Drop image to add layer
          </span>
        </div>
      )}

      {showChrome && (
        <div className="pointer-events-none absolute left-4 top-4 text-2xs-plus text-muted-foreground">
          {scene.name} <span className="tabular-nums">{scene.size.width} × {scene.size.height}</span>
        </div>
      )}
    </div>
  );
}
