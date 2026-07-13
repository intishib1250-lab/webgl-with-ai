import { Box, Circle, Hexagon, ImageIcon, MousePointer2, Sparkles, Square, Type, Waves } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { readFileAsImageAsset } from "@/lib/image-asset";
import { useEditorStore } from "@/state/store";
import { EffectBrowser } from "./panels/EffectBrowser";
import { Model3DBrowser } from "./panels/Model3DBrowser";

export function BottomToolbar() {
  const addLayer = useEditorStore((s) => s.addLayer);
  const addImageLayerFromAsset = useEditorStore((s) => s.addImageLayerFromAsset);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [effectBrowserOpen, setEffectBrowserOpen] = useState(false);
  const [model3dBrowserOpen, setModel3dBrowserOpen] = useState(false);

  return (
    <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-[var(--surface-1)]/95 p-1.5 shadow-2xl backdrop-blur">
      <ToolButton label="Select" active>
        <MousePointer2 size={16} />
      </ToolButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Shape">
            <Square size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="top" className="w-32">
          <DropdownMenuItem onSelect={() => addLayer("shape", { shape: "rectangle" })}>
            <Square size={13} className="text-muted-foreground" /> Rectangle
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => addLayer("shape", { shape: "ellipse" })}>
            <Circle size={13} className="text-muted-foreground" /> Ellipse
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => addLayer("shape", { shape: "polygon" })}>
            <Hexagon size={13} className="text-muted-foreground" /> Polygon
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolButton label="Text" onClick={() => addLayer("text")}>
        <Type size={16} />
      </ToolButton>

      <ToolButton label="Image" onClick={() => fileInputRef.current?.click()}>
        <ImageIcon size={16} />
      </ToolButton>

      <ToolButton label="Gradient" onClick={() => addLayer("gradient")}>
        <Waves size={16} />
      </ToolButton>

      <ToolButton label="3D Model" onClick={() => setModel3dBrowserOpen(true)}>
        <Box size={16} />
      </ToolButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolButton label="Effect" onClick={() => setEffectBrowserOpen(true)}>
        <Sparkles size={16} />
      </ToolButton>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const asset = await readFileAsImageAsset(file);
          addImageLayerFromAsset(asset);
        }}
      />

      <EffectBrowser
        open={effectBrowserOpen}
        onOpenChange={setEffectBrowserOpen}
        onPick={(effectId) => addLayer("effect", { effectId })}
      />
      <Model3DBrowser
        open={model3dBrowserOpen}
        onOpenChange={setModel3dBrowserOpen}
        onPick={(primitive) => addLayer("model3d", { primitive })}
      />
    </div>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "default" : "ghost"}
          size="icon"
          className="rounded-full"
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
