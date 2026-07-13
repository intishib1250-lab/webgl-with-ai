import { AngleDial } from "@/editor/controls/AngleDial";
import { Field, Section } from "@/editor/controls/Field";
import { SegmentedControl, SelectControl } from "@/editor/controls/SelectControl";
import { SliderControl } from "@/editor/controls/SliderControl";
import { BlendMode, EffectLayer, Layer, Model3DLayer, ShapeKind } from "@/core/scene-types";

type ContentLayer = Exclude<Layer, EffectLayer | Model3DLayer>;
import { BLEND_MODE_OPTIONS } from "@/lib/blend-modes";
import { useEditorStore } from "@/state/store";
import { EffectsStack } from "./EffectsStack";
import { FillControl, GradientFillEditor } from "./FillControl";
import { FontPicker } from "./FontPicker";

export function LayerProperties({ layer }: { layer: ContentLayer }) {
  const renameLayer = useEditorStore((s) => s.renameLayer);
  const setLayerBlendMode = useEditorStore((s) => s.setLayerBlendMode);
  const setLayerOpacity = useEditorStore((s) => s.setLayerOpacity);
  const updateLayerTransform = useEditorStore((s) => s.updateLayerTransform);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const commitHistory = useEditorStore((s) => s.commitHistory);

  return (
    <>
      <Section title="Layer">
        <Field label="Name">
          <input
            className="w-36 rounded-sm border border-[var(--surface-border)] bg-[var(--surface-1)] px-1.5 py-1 text-2xs-plus text-[var(--text-primary)] outline-none focus-visible:border-[var(--brand)]"
            value={layer.name}
            onChange={(e) => renameLayer(layer.id, e.target.value)}
          />
        </Field>
        <Field label="Blend mode">
          <SelectControl value={layer.blendMode} options={BLEND_MODE_OPTIONS} onChange={(v) => setLayerBlendMode(layer.id, v as BlendMode)} />
        </Field>
        <Field label="Opacity">
          <SliderControl
            value={layer.opacity}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setLayerOpacity(layer.id, v, true)}
            onCommit={commitHistory}
          />
        </Field>
      </Section>

      <Section title="Transform">
        <Field label="Position X">
          <SliderControl
            value={layer.transform.x}
            min={-2000}
            max={4000}
            step={1}
            onChange={(x) => updateLayerTransform(layer.id, { x }, true)}
            onCommit={commitHistory}
          />
        </Field>
        <Field label="Position Y">
          <SliderControl
            value={layer.transform.y}
            min={-2000}
            max={4000}
            step={1}
            onChange={(y) => updateLayerTransform(layer.id, { y }, true)}
            onCommit={commitHistory}
          />
        </Field>
        <Field label="Scale">
          <SliderControl
            value={layer.transform.scale}
            min={0.05}
            max={5}
            step={0.01}
            onChange={(scale) => updateLayerTransform(layer.id, { scale }, true)}
            onCommit={commitHistory}
          />
        </Field>
        <Field label="Rotation">
          <AngleDial
            value={layer.transform.rotationDeg}
            onChange={(rotationDeg) => updateLayerTransform(layer.id, { rotationDeg }, true)}
            onCommit={commitHistory}
          />
        </Field>
      </Section>

      {layer.type === "text" && (
        <Section title="Text">
          <Field label="Font">
            <FontPicker value={layer.fontFamily} onChange={(fontFamily) => updateLayer(layer.id, (l) => ({ ...l, fontFamily }))} />
          </Field>
          <Field label="Weight">
            <SelectControl
              value={String(layer.fontWeight)}
              options={[300, 400, 500, 600, 700, 800, 900].map((w) => ({ value: String(w), label: String(w) }))}
              onChange={(v) => updateLayer(layer.id, (l) => ({ ...l, fontWeight: Number(v) }))}
            />
          </Field>
          <Field label="Size">
            <SliderControl
              value={layer.fontSize}
              min={8}
              max={400}
              step={1}
              onChange={(fontSize) => updateLayer(layer.id, (l) => ({ ...l, fontSize }), `${layer.id}.fontSize`)}
              onCommit={commitHistory}
            />
          </Field>
          <Field label="Letter spacing">
            <SliderControl
              value={layer.letterSpacing}
              min={-10}
              max={60}
              step={0.5}
              onChange={(letterSpacing) => updateLayer(layer.id, (l) => ({ ...l, letterSpacing }), `${layer.id}.letterSpacing`)}
              onCommit={commitHistory}
            />
          </Field>
          <Field label="Line height">
            <SliderControl
              value={layer.lineHeight}
              min={0.6}
              max={2.5}
              step={0.05}
              onChange={(lineHeight) => updateLayer(layer.id, (l) => ({ ...l, lineHeight }), `${layer.id}.lineHeight`)}
              onCommit={commitHistory}
            />
          </Field>
          <Field label="Align">
            <SegmentedControl
              value={layer.align}
              options={[
                { value: "left", label: "Left" },
                { value: "center", label: "Center" },
                { value: "right", label: "Right" },
              ]}
              onChange={(align) => updateLayer(layer.id, (l) => ({ ...l, align: align as "left" | "center" | "right" }))}
            />
          </Field>
          <textarea
            className="mt-2 w-full resize-none rounded-sm border border-[var(--surface-border)] bg-[var(--surface-1)] px-2 py-1.5 text-2xs-plus text-[var(--text-primary)] outline-none focus-visible:border-[var(--brand)]"
            rows={2}
            value={layer.content}
            onChange={(e) => updateLayer(layer.id, (l) => ({ ...l, content: e.target.value }))}
          />
          <div className="mt-2">
            <FillControl fill={layer.fill} onChange={(fill) => updateLayer(layer.id, (l) => ({ ...l, fill }))} allowMesh={false} />
          </div>
        </Section>
      )}

      {layer.type === "shape" && (
        <Section title="Shape">
          <Field label="Kind">
            <SelectControl
              value={layer.shape}
              options={[
                { value: "rectangle", label: "Rectangle" },
                { value: "ellipse", label: "Ellipse" },
                { value: "plane", label: "Plane" },
                { value: "polygon", label: "Polygon" },
              ]}
              onChange={(shape) => updateLayer(layer.id, (l) => ({ ...l, shape: shape as ShapeKind }))}
            />
          </Field>
          <Field label="Width">
            <SliderControl
              value={layer.width}
              min={1}
              max={4000}
              step={1}
              onChange={(width) => updateLayer(layer.id, (l) => ({ ...l, width }), `${layer.id}.width`)}
              onCommit={commitHistory}
            />
          </Field>
          <Field label="Height">
            <SliderControl
              value={layer.height}
              min={1}
              max={4000}
              step={1}
              onChange={(height) => updateLayer(layer.id, (l) => ({ ...l, height }), `${layer.id}.height`)}
              onCommit={commitHistory}
            />
          </Field>
          {layer.shape === "rectangle" && (
            <Field label="Corner radius">
              <SliderControl
                value={layer.cornerRadius}
                min={0}
                max={400}
                step={1}
                onChange={(cornerRadius) => updateLayer(layer.id, (l) => ({ ...l, cornerRadius }), `${layer.id}.cornerRadius`)}
                onCommit={commitHistory}
              />
            </Field>
          )}
          {layer.shape === "polygon" && (
            <Field label="Sides">
              <SliderControl
                value={layer.sides}
                min={3}
                max={12}
                step={1}
                onChange={(sides) => updateLayer(layer.id, (l) => ({ ...l, sides }), `${layer.id}.sides`)}
                onCommit={commitHistory}
              />
            </Field>
          )}
          <div className="mt-2">
            <FillControl fill={layer.fill} onChange={(fill) => updateLayer(layer.id, (l) => ({ ...l, fill }))} />
          </div>
        </Section>
      )}

      {layer.type === "gradient" && (
        <Section title="Gradient">
          <GradientFillEditor gradient={layer.gradient} onChange={(gradient) => updateLayer(layer.id, (l) => ({ ...l, gradient }))} />
        </Section>
      )}

      <div className="px-3 py-3">
        <EffectsStack targetId={layer.id} effects={layer.effects} />
      </div>
    </>
  );
}
