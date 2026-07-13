import { CheckCircle2, Download, Menu, Minus, Pause, Play as PlayIcon, Plus, Redo2, Undo2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { downloadProjectJson, parseProjectJsonFile } from "@/state/persistence";
import { useEditorStore } from "@/state/store";
import { exportScenePng } from "@/lib/png-export";
import { downloadEmbedBundle } from "@/lib/embed-export";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const RESOLUTION_STEPS = [0.5, 1, 2] as const;

export function TopBar() {
  const scene = useEditorStore((s) => s.scene);
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const setSceneName = useEditorStore((s) => s.setSceneName);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const loadScene = useEditorStore((s) => s.loadScene);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const resolutionScale = useEditorStore((s) => s.resolutionScale);
  const setResolutionScale = useEditorStore((s) => s.setResolutionScale);

  const [nameDraft, setNameDraft] = useState(scene.name);
  const [exporting, setExporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setNameDraft(scene.name), [scene.name]);

  if (mode === "play") {
    return (
      <div className="pointer-events-none absolute right-3 top-3 z-30">
        <Button variant="secondary" className="pointer-events-auto shadow-lg backdrop-blur" onClick={() => setMode("edit")}>
          <Pause size={12} /> Exit play
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-14 shrink-0 items-center gap-3 bg-[var(--surface-0)] px-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Project menu">
            <Menu size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem onSelect={() => importInputRef.current?.click()}>
            <Upload size={13} className="text-muted-foreground" /> Import project…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => downloadProjectJson(scene)}>
            <Download size={13} className="text-muted-foreground" /> Export project JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const nextScene = await parseProjectJsonFile(file);
          loadScene(nextScene);
        }}
      />

      <div className="flex items-center gap-1.5 rounded-lg bg-[var(--surface-1)] px-1 py-1">
        <input
          className="w-40 rounded-sm border border-transparent bg-transparent px-1.5 py-1 text-2xs-plus font-medium text-foreground outline-none hover:border-border focus-visible:border-[var(--brand)]"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => setSceneName(nameDraft.trim() || "Untitled Scene")}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <CheckCircle2 size={14} className="mr-1 shrink-0 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent side="bottom">Autosaved</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon-sm" onClick={undo} disabled={past.length === 0} aria-label="Undo">
          <Undo2 size={14} />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={redo} disabled={future.length === 0} aria-label="Redo">
          <Redo2 size={14} />
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg bg-[var(--surface-1)] px-1 py-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom(zoom - 0.1)} aria-label="Zoom out">
            <Minus size={13} />
          </Button>
          <span className="w-10 text-center text-2xs-plus tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom(zoom + 0.1)} aria-label="Zoom in">
            <Plus size={13} />
          </Button>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-2xs-plus"
              onClick={() => {
                const currentIndex = RESOLUTION_STEPS.indexOf(resolutionScale as (typeof RESOLUTION_STEPS)[number]);
                const next = RESOLUTION_STEPS[(currentIndex + 1) % RESOLUTION_STEPS.length];
                setResolutionScale(next);
              }}
            >
              {resolutionScale >= 2 ? "4K" : resolutionScale >= 1 ? "HD" : "SD"}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Render resolution ({resolutionScale}×) — click to cycle</TooltipContent>
        </Tooltip>

        <Button variant="ghost" size="icon-sm" onClick={() => setMode("play")} aria-label="Play">
          <PlayIcon size={15} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="text-2xs-plus">
              <Download size={12} /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              disabled={exporting}
              onSelect={async () => {
                setExporting(true);
                try {
                  await exportScenePng(scene);
                } finally {
                  setExporting(false);
                }
              }}
            >
              PNG snapshot
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => downloadEmbedBundle(scene)}>Embed (HTML + JS)</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => downloadProjectJson(scene)}>Project JSON</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
