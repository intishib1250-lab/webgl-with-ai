import { useEffect } from "react";
import { useEditorStore } from "@/state/store";

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable);
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;

      const store = useEditorStore.getState();
      const meta = event.metaKey || event.ctrlKey;

      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
        return;
      }

      if (meta && event.key.toLowerCase() === "d") {
        event.preventDefault();
        if (store.selectedLayerId) store.duplicateLayer(store.selectedLayerId);
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && store.selectedLayerId) {
        event.preventDefault();
        store.removeLayer(store.selectedLayerId);
        return;
      }

      if (event.key.startsWith("Arrow") && store.selectedLayerId) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const layer = store.scene.layers.find((l) => l.id === store.selectedLayerId);
        if (!layer || layer.type === "effect") return;
        const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
        const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
        store.updateLayerTransform(layer.id, { x: layer.transform.x + dx, y: layer.transform.y + dy }, true);
        store.commitHistory();
        return;
      }

      if (event.key.toLowerCase() === "escape") {
        store.selectLayer(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
