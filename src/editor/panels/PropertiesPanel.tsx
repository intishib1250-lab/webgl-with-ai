import { useEditorStore } from "@/state/store";
import { EffectLayerProperties } from "./EffectLayerProperties";
import { LayerProperties } from "./LayerProperties";
import { Model3DLayerProperties } from "./Model3DLayerProperties";
import { SceneProperties } from "./SceneProperties";

export function PropertiesPanel() {
  const scene = useEditorStore((s) => s.scene);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const selectedLayer = scene.layers.find((l) => l.id === selectedLayerId) ?? null;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-[var(--surface-border)] px-3 py-2.5">
        <h2 className="text-2xs-plus font-medium text-[var(--text-primary)]">{selectedLayer ? selectedLayer.name : "Scene"}</h2>
      </div>
      {selectedLayer?.type === "effect" ? (
        <EffectLayerProperties key={selectedLayer.id} layer={selectedLayer} />
      ) : selectedLayer?.type === "model3d" ? (
        <Model3DLayerProperties key={selectedLayer.id} layer={selectedLayer} />
      ) : selectedLayer ? (
        <LayerProperties key={selectedLayer.id} layer={selectedLayer} />
      ) : (
        <SceneProperties />
      )}
    </div>
  );
}
