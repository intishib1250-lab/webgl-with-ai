import { useRef } from "react";
import { ColorInput } from "@/editor/controls/ColorInput";
import { PairField, TripleField } from "@/editor/controls/CompactField";
import { Field, Section } from "@/editor/controls/Field";
import { SelectControl } from "@/editor/controls/SelectControl";
import { SliderControl } from "@/editor/controls/SliderControl";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MODEL3D_LABEL } from "@/core/scene-defaults";
import { Model3DLayer, Model3DPrimitive } from "@/core/scene-types";
import { BLEND_MODE_OPTIONS } from "@/lib/blend-modes";
import { readFileAsImageAsset } from "@/lib/image-asset";
import { useEditorStore } from "@/state/store";
import { EffectsStack } from "./EffectsStack";

const PRIMITIVE_OPTIONS = (Object.keys(MODEL3D_LABEL) as Model3DPrimitive[]).map((value) => ({
  value,
  label: MODEL3D_LABEL[value],
}));

const REPEAT_TYPE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "xy", label: "2D XY" },
  { value: "x", label: "2D X" },
  { value: "y", label: "2D Y" },
  { value: "xyz", label: "3D" },
  { value: "radial", label: "Radial" },
  { value: "radial2", label: "Radial 2" },
];

const SURFACE_TEXTURE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "image", label: "Image" },
  { value: "striped", label: "Striped" },
  { value: "wavy", label: "Wavy" },
  { value: "beaded", label: "Beaded" },
  { value: "diamond", label: "Diamond" },
  { value: "linoleum", label: "Linoleum" },
];

export function Model3DLayerProperties({ layer }: { layer: Model3DLayer }) {
  const renameLayer = useEditorStore((s) => s.renameLayer);
  const setLayerBlendMode = useEditorStore((s) => s.setLayerBlendMode);
  const setLayerOpacity = useEditorStore((s) => s.setLayerOpacity);
  const updateLayerTransform = useEditorStore((s) => s.updateLayerTransform);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const addImageAsset = useEditorStore((s) => s.addImageAsset);
  const commitHistory = useEditorStore((s) => s.commitHistory);
  const scene = useEditorStore((s) => s.scene);
  const textureInputRef = useRef<HTMLInputElement>(null);
  const svgInputRef = useRef<HTMLInputElement>(null);

  const set = (updater: (l: Model3DLayer) => Model3DLayer, coalesce?: string) =>
    updateLayer(layer.id, (l) => (l.type === "model3d" ? updater(l) : l), coalesce);

  const posXPct = (layer.transform.x / scene.size.width) * 100;
  const posYPct = (layer.transform.y / scene.size.height) * 100;

  return (
    <>
      <Section title="Layer">
        <Field label="Name">
          <input
            className="w-36 rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-2xs-plus text-foreground outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand)]"
            value={layer.name}
            onChange={(e) => renameLayer(layer.id, e.target.value)}
          />
        </Field>
        <Field label="Blend mode">
          <SelectControl value={layer.blendMode} options={BLEND_MODE_OPTIONS} onChange={(v) => setLayerBlendMode(layer.id, v as typeof layer.blendMode)} />
        </Field>
        <Field label="Opacity">
          <SliderControl value={layer.opacity} min={0} max={1} step={0.01} onChange={(v) => setLayerOpacity(layer.id, v, true)} onCommit={commitHistory} />
        </Field>
      </Section>

      <Section title="3D Shape">
        <PairField
          label="Position"
          a={{ label: "X", value: posXPct, onChange: (v) => updateLayerTransform(layer.id, { x: (v / 100) * scene.size.width }, true) }}
          b={{ label: "Y", value: posYPct, onChange: (v) => updateLayerTransform(layer.id, { y: (v / 100) * scene.size.height }, true) }}
          onCommit={commitHistory}
        />
        <TripleField
          label="Axis"
          a={{ label: "X", value: layer.rotation3d.x, onChange: (v) => set((l) => ({ ...l, rotation3d: { ...l.rotation3d, x: v } }), `${layer.id}.axisx`) }}
          b={{ label: "Y", value: layer.rotation3d.y, onChange: (v) => set((l) => ({ ...l, rotation3d: { ...l.rotation3d, y: v } }), `${layer.id}.axisy`) }}
          c={{ label: "Z", value: layer.rotation3d.z, onChange: (v) => set((l) => ({ ...l, rotation3d: { ...l.rotation3d, z: v } }), `${layer.id}.axisz`) }}
          onCommit={commitHistory}
        />
        <Field label="Shape">
          <SelectControl value={layer.primitive} options={PRIMITIVE_OPTIONS} onChange={(primitive) => set((l) => ({ ...l, primitive: primitive as Model3DPrimitive }))} />
        </Field>
        {layer.primitive === "custom" && (
          <Field label="SVG">
            <Button variant="outline" size="sm" onClick={() => svgInputRef.current?.click()}>
              {layer.customMapAssetId ? "Replace…" : "None selected"}
            </Button>
          </Field>
        )}
        <Field label="FOV">
          <SliderControl value={layer.fov} min={10} max={120} step={1} onChange={(fov) => set((l) => ({ ...l, fov }), `${layer.id}.fov`)} onCommit={commitHistory} />
        </Field>
        <PercentField label="Scale" value={layer.scale3d} min={0} max={100} overflow onChange={(v) => set((l) => ({ ...l, scale3d: v }), `${layer.id}.scale3d`)} onCommit={commitHistory} />
        <PairField
          label="Twist"
          a={{ label: "X", value: layer.twist.x * 100, onChange: (v) => set((l) => ({ ...l, twist: { ...l.twist, x: v / 100 } }), `${layer.id}.twistx`) }}
          b={{ label: "Y", value: layer.twist.y * 100, onChange: (v) => set((l) => ({ ...l, twist: { ...l.twist, y: v / 100 } }), `${layer.id}.twisty`) }}
          onCommit={commitHistory}
          min={-100}
          max={100}
        />
        <PercentField label="Rounding" value={layer.rounding} min={0} max={100} onChange={(v) => set((l) => ({ ...l, rounding: v }), `${layer.id}.rounding`)} onCommit={commitHistory} />
        <PercentField label="Variation" value={layer.variation} min={0} max={100} onChange={(v) => set((l) => ({ ...l, variation: v }), `${layer.id}.variation`)} onCommit={commitHistory} />
        <PercentField label="Smoothing" value={layer.smoothing} min={0} max={100} onChange={(v) => set((l) => ({ ...l, smoothing: v }), `${layer.id}.smoothing`)} onCommit={commitHistory} />
        <PercentField label="Extrude" value={layer.extrude} min={0} max={100} onChange={(v) => set((l) => ({ ...l, extrude: v }), `${layer.id}.extrude`)} onCommit={commitHistory} />
        <PercentField label="Mix" value={layer.mix} min={0} max={100} onChange={(v) => set((l) => ({ ...l, mix: v }), `${layer.id}.mix`)} onCommit={commitHistory} />
        <Field label="Show background">
          <Switch checked={layer.showBackground} onCheckedChange={(showBackground) => { set((l) => ({ ...l, showBackground })); commitHistory(); }} />
        </Field>
      </Section>

      <Section title="Repeat">
        <Field label="Type">
          <SelectControl value={layer.repeatType} options={REPEAT_TYPE_OPTIONS} onChange={(repeatType) => { set((l) => ({ ...l, repeatType: repeatType as Model3DLayer["repeatType"] })); commitHistory(); }} />
        </Field>
        {layer.repeatType !== "none" && (
          <PercentField label="Spacing" value={layer.repeatSpacing} min={0} max={100} onChange={(v) => set((l) => ({ ...l, repeatSpacing: v }), `${layer.id}.repeatSpacing`)} onCommit={commitHistory} />
        )}
      </Section>

      <Section title="Refraction / Reflection">
        <PercentField label="Amount" value={layer.refraction.amount} min={0} max={100} onChange={(v) => set((l) => ({ ...l, refraction: { ...l.refraction, amount: v } }), `${layer.id}.refractAmount`)} onCommit={commitHistory} />
        <Field label="Behavior">
          <Tabs
            value={layer.refraction.behavior}
            onValueChange={(behavior) => { set((l) => ({ ...l, refraction: { ...l.refraction, behavior: behavior as "refract" | "reflect" } })); commitHistory(); }}
          >
            <TabsList className="h-6 p-0.5">
              <TabsTrigger className="h-full px-2 text-2xs-plus" value="refract">Refract</TabsTrigger>
              <TabsTrigger className="h-full px-2 text-2xs-plus" value="reflect">Reflect</TabsTrigger>
            </TabsList>
          </Tabs>
        </Field>
        <PercentField label="Dispersion" value={layer.refraction.dispersion} min={0} max={100} onChange={(v) => set((l) => ({ ...l, refraction: { ...l.refraction, dispersion: v } }), `${layer.id}.dispersion`)} onCommit={commitHistory} />
        <PercentField label="Roughness" value={layer.refraction.roughness} min={0} max={100} onChange={(v) => set((l) => ({ ...l, refraction: { ...l.refraction, roughness: v } }), `${layer.id}.refractRoughness`)} onCommit={commitHistory} />
      </Section>

      <Section title="Surface texture">
        <Field label="Type">
          <SelectControl
            value={layer.surfaceTexture.type}
            options={SURFACE_TEXTURE_OPTIONS}
            onChange={(type) => { set((l) => ({ ...l, surfaceTexture: { ...l.surfaceTexture, type: type as Model3DLayer["surfaceTexture"]["type"] } })); commitHistory(); }}
          />
        </Field>
        {layer.surfaceTexture.type === "image" && (
          <Field label="Image">
            <Button variant="outline" size="sm" onClick={() => textureInputRef.current?.click()}>
              {layer.textureAssetId ? "Replace…" : "Upload…"}
            </Button>
          </Field>
        )}
        <PercentField label="Amount" value={layer.surfaceTexture.amount} min={0} max={100} onChange={(v) => set((l) => ({ ...l, surfaceTexture: { ...l.surfaceTexture, amount: v } }), `${layer.id}.texAmount`)} onCommit={commitHistory} />
        <PercentField label="Scale" value={layer.surfaceTexture.scale} min={0} max={100} onChange={(v) => set((l) => ({ ...l, surfaceTexture: { ...l.surfaceTexture, scale: v } }), `${layer.id}.texScale`)} onCommit={commitHistory} />
        <Field label="Color">
          <ColorInput value={layer.material.color} onChange={(color) => set((l) => ({ ...l, material: { ...l.material, color } }))} onCommit={commitHistory} />
        </Field>
        <Field label="Roughness">
          <SliderControl value={layer.material.roughness} min={0} max={1} step={0.01} onChange={(v) => set((l) => ({ ...l, material: { ...l.material, roughness: v } }), `${layer.id}.roughness`)} onCommit={commitHistory} />
        </Field>
        <Field label="Metalness">
          <SliderControl value={layer.material.metalness} min={0} max={1} step={0.01} onChange={(v) => set((l) => ({ ...l, material: { ...l.material, metalness: v } }), `${layer.id}.metalness`)} onCommit={commitHistory} />
        </Field>

        <input
          ref={textureInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const asset = await readFileAsImageAsset(file);
            addImageAsset(asset);
            set((l) => ({ ...l, textureAssetId: asset.id }));
            commitHistory();
          }}
        />
        <input
          ref={svgInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const asset = await readFileAsImageAsset(file);
            addImageAsset(asset);
            set((l) => ({ ...l, customMapAssetId: asset.id }));
            commitHistory();
          }}
        />
      </Section>

      <Section title="Light">
        <PercentField label="Specular" value={layer.light.specular} min={0} max={100} onChange={(v) => set((l) => ({ ...l, light: { ...l.light, specular: v } }), `${layer.id}.specular`)} onCommit={commitHistory} />
        <PercentField label="Fresnel" value={layer.light.fresnel} min={0} max={100} onChange={(v) => set((l) => ({ ...l, light: { ...l.light, fresnel: v } }), `${layer.id}.fresnel`)} onCommit={commitHistory} />
        <TripleField
          label="Position"
          a={{ label: "X", value: layer.light.positionX, onChange: (v) => set((l) => ({ ...l, light: { ...l.light, positionX: v } }), `${layer.id}.lightx`) }}
          b={{ label: "Y", value: layer.light.positionY, onChange: (v) => set((l) => ({ ...l, light: { ...l.light, positionY: v } }), `${layer.id}.lighty`) }}
          c={{ label: "Z", value: layer.light.positionZ, onChange: (v) => set((l) => ({ ...l, light: { ...l.light, positionZ: v } }), `${layer.id}.lightz`) }}
          onCommit={commitHistory}
          min={-10}
          max={10}
        />
      </Section>

      <Section title="Color">
        <Field label="Color">
          <ColorInput value={layer.light.color} onChange={(color) => set((l) => ({ ...l, light: { ...l.light, color } }))} onCommit={commitHistory} />
        </Field>
        <PercentField label="Opaqueness" value={layer.light.opaqueness} min={0} max={100} onChange={(v) => set((l) => ({ ...l, light: { ...l.light, opaqueness: v } }), `${layer.id}.opaqueness`)} onCommit={commitHistory} />
      </Section>

      <Section title="Animation">
        <PercentField label="Speed" value={layer.animationSpeed} min={-100} max={100} overflow onChange={(v) => set((l) => ({ ...l, animationSpeed: v }), `${layer.id}.animSpeed`)} onCommit={commitHistory} />
        <TripleField
          label="Direction"
          a={{ label: "X", value: layer.animationDirection.x * 100, onChange: (v) => set((l) => ({ ...l, animationDirection: { ...l.animationDirection, x: v / 100 } }), `${layer.id}.dirx`) }}
          b={{ label: "Y", value: layer.animationDirection.y * 100, onChange: (v) => set((l) => ({ ...l, animationDirection: { ...l.animationDirection, y: v / 100 } }), `${layer.id}.diry`) }}
          c={{ label: "Z", value: layer.animationDirection.z * 100, onChange: (v) => set((l) => ({ ...l, animationDirection: { ...l.animationDirection, z: v / 100 } }), `${layer.id}.dirz`) }}
          onCommit={commitHistory}
          min={-100}
          max={100}
          step={10}
        />
      </Section>

      <Section title="Interactivity">
        <PercentField label="Track mouse" value={layer.trackMouseAmount} min={0} max={100} onChange={(v) => set((l) => ({ ...l, trackMouseAmount: v }), `${layer.id}.trackMouse`)} onCommit={commitHistory} />
        <Field label="Mouse axes">
          <Tabs
            value={layer.mouseAxes}
            onValueChange={(mouseAxes) => { set((l) => ({ ...l, mouseAxes: mouseAxes as Model3DLayer["mouseAxes"] })); commitHistory(); }}
          >
            <TabsList className="h-6 p-0.5">
              <TabsTrigger className="h-full px-2 text-2xs-plus" value="x">X</TabsTrigger>
              <TabsTrigger className="h-full px-2 text-2xs-plus" value="y">Y</TabsTrigger>
              <TabsTrigger className="h-full px-2 text-2xs-plus" value="both">Both</TabsTrigger>
            </TabsList>
          </Tabs>
        </Field>
        <PercentField label="Momentum" value={layer.momentum} min={0} max={100} onChange={(v) => set((l) => ({ ...l, momentum: v }), `${layer.id}.momentum`)} onCommit={commitHistory} />
        <PercentField label="Spring" value={layer.spring} min={0} max={100} onChange={(v) => set((l) => ({ ...l, spring: v }), `${layer.id}.spring`)} onCommit={commitHistory} />
        <PercentField label="Texture" value={layer.interactiveTextureAmount} min={0} max={100} onChange={(v) => set((l) => ({ ...l, interactiveTextureAmount: v }), `${layer.id}.interactiveTexture`)} onCommit={commitHistory} />
        <PercentField label="Axis tilt" value={layer.axisTilt} min={0} max={100} onChange={(v) => set((l) => ({ ...l, axisTilt: v }), `${layer.id}.axisTilt`)} onCommit={commitHistory} />
      </Section>

      <div className="px-3 py-3">
        <EffectsStack targetId={layer.id} effects={layer.effects} />
      </div>
    </>
  );
}

/** 0..1-backed value shown/edited as a percentage slider. With `overflow`, the slider track stays [min, max] but typing/dragging the number box isn't clamped. */
function PercentField({
  label,
  value,
  min,
  max,
  overflow,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  overflow?: boolean;
  onChange: (value: number) => void;
  onCommit: () => void;
}) {
  return (
    <Field label={label}>
      <SliderControl
        value={value * 100}
        min={min}
        max={max}
        step={1}
        suffix="%"
        clampMin={overflow ? -Infinity : undefined}
        clampMax={overflow ? Infinity : undefined}
        onChange={(v) => onChange(v / 100)}
        onCommit={onCommit}
      />
    </Field>
  );
}

