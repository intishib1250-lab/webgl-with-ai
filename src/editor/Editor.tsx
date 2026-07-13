import { Toaster } from "sonner";
import { BottomToolbar } from "./BottomToolbar";
import { CanvasViewport } from "./canvas/CanvasViewport";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { LayersPanel } from "./panels/LayersPanel";
import { PropertiesPanel } from "./panels/PropertiesPanel";
import { TopBar } from "./TopBar";
import { useEditorStore } from "@/state/store";

export function Editor() {
  useKeyboardShortcuts();
  const mode = useEditorStore((s) => s.mode);

  if (mode === "play") {
    return (
      <div className="relative h-full w-full bg-[var(--surface-0)]">
        <TopBar />
        <CanvasViewport />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[var(--surface-0)]">
      <TopBar />
      <div className="relative flex-1 overflow-hidden">
        <CanvasViewport />

        <div className="pointer-events-none absolute inset-3 z-10">
          <div className="pointer-events-auto absolute left-0 top-0 max-h-[calc(100%-4.5rem)] w-64 overflow-hidden rounded-xl border border-border bg-[var(--surface-1)]/95 shadow-2xl backdrop-blur">
            <LayersPanel />
          </div>
          <div className="pointer-events-auto absolute right-0 top-0 bottom-0 w-72 overflow-hidden rounded-xl border border-border bg-[var(--surface-1)]/95 shadow-2xl backdrop-blur">
            <PropertiesPanel />
          </div>
        </div>

        <BottomToolbar />
      </div>
      <Toaster
        theme="dark"
        position="bottom-center"
        toastOptions={{ style: { background: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--surface-border-strong)" } }}
      />
    </div>
  );
}
