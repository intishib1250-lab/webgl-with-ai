import { useRef, useState } from "react";
import { Field, Section } from "@/editor/controls/Field";
import { SelectControl } from "@/editor/controls/SelectControl";
import { SliderControl } from "@/editor/controls/SliderControl";
import { BlendMode, EffectLayer } from "@/core/scene-types";
import { getEffectDefinition } from "@/effects/registry";
import { BLEND_MODE_OPTIONS } from "@/lib/blend-modes";
import { readFileAsImageAsset } from "@/lib/image-asset";
import { useEditorStore } from "@/state/store";
import { EffectParamControl } from "./EffectParamControl";

export function EffectLayerProperties({ layer }: { layer: EffectLayer }) {
  const renameLayer = useEditorStore((s) => s.renameLayer);
  const setLayerOpacity = useEditorStore((s) => s.setLayerOpacity);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const addImageAsset = useEditorStore((s) => s.addImageAsset);
  const commitHistory = useEditorStore((s) => s.commitHistory);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickingParamKey, setPickingParamKey] = useState<string | null>(null);

  const definition = getEffectDefinition(layer.effectId);

  const setParam = (key: string, value: number | string | boolean, coalesce?: boolean) =>
    updateLayer(layer.id, (l) => (l.type === "effect" ? { ...l, params: { ...l.params, [key]: value } } : l), coalesce ? `${layer.id}.${key}` : undefined);

  return (
    <>
      <Section title="Effect layer">
        <Field label="Name">
          <input
            className="w-36 rounded-sm border border-input bg-[var(--surface-1)] px-1.5 py-1 text-2xs-plus text-foreground outline-none focus-visible:border-[var(--brand)]"
            value={layer.name}
            onChange={(e) => renameLayer(layer.id, e.target.value)}
          />
        </Field>
        <Field label="Blend mode">
          <SelectControl
            value={layer.blendMode}
            options={BLEND_MODE_OPTIONS}
            onChange={(blendMode) => {
              updateLayer(layer.id, (l) => (l.type === "effect" ? { ...l, blendMode: blendMode as BlendMode } : l));
              commitHistory();
            }}
          />
        </Field>
        <Field label="Mix">
          <SliderControl
            value={layer.opacity}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setLayerOpacity(layer.id, v, true)}
            onCommit={commitHistory}
          />
        </Field>
        {definition && (
          <p className="pt-1 text-2xs text-muted-foreground">
            Applies to everything below this layer in the stack, up to the next effect layer.
          </p>
        )}
      </Section>

      {definition && (
        <Section title={definition.label}>
          <Field label="Speed">
            <SliderControl
              value={layer.speed}
              min={0}
              max={4}
              step={0.05}
              onChange={(speed) => updateLayer(layer.id, (l) => (l.type === "effect" ? { ...l, speed } : l), `${layer.id}.speed`)}
              onCommit={commitHistory}
            />
          </Field>
          {definition.params.map((paramSchema) => (
            <EffectParamControl
              key={paramSchema.key}
              schema={paramSchema}
              value={layer.params[paramSchema.key]}
              onChange={setParam}
              onCommit={commitHistory}
              onPickImage={() => {
                setPickingParamKey(paramSchema.key);
                fileInputRef.current?.click();
              }}
            />
          ))}
        </Section>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file || !pickingParamKey) return;
          const asset = await readFileAsImageAsset(file);
          addImageAsset(asset);
          setParam(pickingParamKey, asset.id);
          commitHistory();
          setPickingParamKey(null);
        }}
      />
    </>
  );
}
