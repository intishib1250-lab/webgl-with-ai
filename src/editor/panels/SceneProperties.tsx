import { Field, Section } from "@/editor/controls/Field";
import { SelectControl } from "@/editor/controls/SelectControl";
import { SliderControl } from "@/editor/controls/SliderControl";
import { ArtboardPreset } from "@/core/scene-types";
import { useEditorStore } from "@/state/store";
import { EffectsStack } from "./EffectsStack";
import { FillControl } from "./FillControl";

const PRESETS: { value: ArtboardPreset; label: string }[] = [
  { value: "1920x1080", label: "1920 × 1080" },
  { value: "1080x1080", label: "1080 × 1080" },
  { value: "1080x1920", label: "1080 × 1920" },
  { value: "custom", label: "Custom" },
];

export function SceneProperties() {
  const scene = useEditorStore((s) => s.scene);
  const setSceneSize = useEditorStore((s) => s.setSceneSize);
  const setSceneBackground = useEditorStore((s) => s.setSceneBackground);
  const setAnimationSpeed = useEditorStore((s) => s.setAnimationSpeed);
  const resolutionScale = useEditorStore((s) => s.resolutionScale);
  const setResolutionScale = useEditorStore((s) => s.setResolutionScale);
  const commitHistory = useEditorStore((s) => s.commitHistory);

  return (
    <>
      <Section title="Scene">
        <Field label="Preset">
          <SelectControl value={scene.size.preset} options={PRESETS} onChange={(v) => setSceneSize(v as ArtboardPreset)} />
        </Field>
        {scene.size.preset === "custom" && (
          <>
            <Field label="Width">
              <SliderControl
                value={scene.size.width}
                min={64}
                max={4096}
                step={1}
                onChange={(width) => setSceneSize("custom", { width, height: scene.size.height })}
                onCommit={commitHistory}
              />
            </Field>
            <Field label="Height">
              <SliderControl
                value={scene.size.height}
                min={64}
                max={4096}
                step={1}
                onChange={(height) => setSceneSize("custom", { width: scene.size.width, height })}
                onCommit={commitHistory}
              />
            </Field>
          </>
        )}
        <Field label="Animation speed">
          <SliderControl
            value={scene.animationSpeed}
            min={0}
            max={4}
            step={0.05}
            onChange={(v) => setAnimationSpeed(v)}
            onCommit={commitHistory}
          />
        </Field>
        <Field label="Resolution scale">
          <SelectControl
            value={String(resolutionScale)}
            options={[
              { value: "0.5", label: "0.5×" },
              { value: "1", label: "1×" },
              { value: "2", label: "2×" },
            ]}
            onChange={(v) => setResolutionScale(Number(v))}
          />
        </Field>
      </Section>

      <Section title="Background">
        <FillControl fill={scene.background.fill} onChange={(fill) => setSceneBackground(fill)} />
      </Section>

      <div className="px-3 py-3">
        <EffectsStack targetId="scene" effects={scene.effects} />
      </div>
    </>
  );
}
