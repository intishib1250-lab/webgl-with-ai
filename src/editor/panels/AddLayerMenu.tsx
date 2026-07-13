import { Box, Circle, Hexagon, ImageIcon, Plus, Square, Type, Waves } from "lucide-react";
import { useRef } from "react";
import { useEditorStore } from "@/state/store";
import { readFileAsImageAsset } from "@/lib/image-asset";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const OPTIONS = [
  { key: "image", label: "Image", icon: ImageIcon },
  { key: "text", label: "Text", icon: Type },
  { key: "rectangle", label: "Rectangle", icon: Square },
  { key: "ellipse", label: "Ellipse", icon: Circle },
  { key: "polygon", label: "Polygon", icon: Hexagon },
  { key: "gradient", label: "Gradient", icon: Waves },
  { key: "model3d", label: "3D Model", icon: Box },
] as const;

export function AddLayerMenu() {
  const addLayer = useEditorStore((s) => s.addLayer);
  const addImageLayerFromAsset = useEditorStore((s) => s.addImageLayerFromAsset);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label="Add layer">
            <Plus size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.key}
              onSelect={() => {
                if (option.key === "image") {
                  fileInputRef.current?.click();
                  return;
                }
                if (option.key === "rectangle" || option.key === "ellipse" || option.key === "polygon") {
                  addLayer("shape", { shape: option.key });
                  return;
                }
                if (option.key === "model3d") {
                  addLayer("model3d", { primitive: "sphere" });
                  return;
                }
                addLayer(option.key as "text" | "gradient");
              }}
            >
              <option.icon size={13} className="text-muted-foreground" />
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
  );
}
