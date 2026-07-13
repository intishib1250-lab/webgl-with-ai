import { useEffect, useRef } from "react";
import { Editor } from "./editor/Editor";
import { TooltipProvider } from "./components/ui/tooltip";
import { loadAutosavedScene, scheduleAutosave } from "./state/persistence";
import { useEditorStore } from "./state/store";

export function App() {
  const restoredRef = useRef(false);

  if (!restoredRef.current) {
    restoredRef.current = true;
    const restored = loadAutosavedScene();
    if (restored) useEditorStore.getState().loadScene(restored);
  }

  useEffect(
    () =>
      useEditorStore.subscribe((state, prevState) => {
        if (state.scene !== prevState.scene) scheduleAutosave(state.scene);
      }),
    [],
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full w-full">
        <Editor />
      </div>
    </TooltipProvider>
  );
}
