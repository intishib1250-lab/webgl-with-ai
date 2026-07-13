import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { readFileAsImageAsset } from "@/lib/image-asset";
import { cn } from "@/lib/utils";
import { getEffectDefinition } from "@/effects/registry";
import { BlendMode, EffectInstance } from "@/core/scene-types";
import { BLEND_MODE_OPTIONS } from "@/lib/blend-modes";
import { useEditorStore } from "@/state/store";
import { AddEffectPicker } from "./AddEffectPicker";
import { EffectParamControl } from "./EffectParamControl";
import { SliderControl } from "@/editor/controls/SliderControl";
import { SelectControl } from "@/editor/controls/SelectControl";
import { Field } from "@/editor/controls/Field";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export function EffectsStack({ targetId, effects }: { targetId: string; effects: EffectInstance[] }) {
  const addEffect = useEditorStore((s) => s.addEffect);
  const reorderEffect = useEditorStore((s) => s.reorderEffect);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const toIndex = effects.findIndex((e) => e.id === over.id);
    if (toIndex === -1) return;
    reorderEffect(targetId, String(active.id), toIndex);
  }

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-xs-plus font-semibold text-[var(--text-primary)]">Effects</h3>
        <AddEffectPicker onPick={(effectId) => addEffect(targetId, effectId)} />
      </div>

      {effects.length === 0 && (
        <p className="rounded-xl bg-[var(--surface-2)]/60 px-2.5 py-3 text-center text-2xs-plus text-[var(--text-tertiary)]">
          No effects yet
        </p>
      )}

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <SortableContext items={effects.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {effects.map((instance) => (
              <EffectRow key={instance.id} targetId={targetId} instance={instance} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function EffectRow({ targetId, instance }: { targetId: string; instance: EffectInstance }) {
  const definition = getEffectDefinition(instance.effectId);
  const toggleEffect = useEditorStore((s) => s.toggleEffect);
  const removeEffect = useEditorStore((s) => s.removeEffect);
  const setEffectSpeed = useEditorStore((s) => s.setEffectSpeed);
  const setEffectBlendMode = useEditorStore((s) => s.setEffectBlendMode);
  const setEffectMix = useEditorStore((s) => s.setEffectMix);
  const setEffectParam = useEditorStore((s) => s.setEffectParam);
  const commitHistory = useEditorStore((s) => s.commitHistory);
  const [expanded, setExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickingParamKey, setPickingParamKey] = useState<string | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: instance.id });

  if (!definition) return null;

  const hasTimeParam = ["noise", "wave", "liquid", "ripple"].includes(definition.id);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-xl bg-[var(--surface-2)]",
        isDragging && "opacity-60",
        !instance.enabled && "opacity-50",
      )}
    >
      <div className="flex items-center gap-1 px-1.5 py-1.5">
        <button className="cursor-grab touch-none text-[var(--text-tertiary)]" {...attributes} {...listeners}>
          <GripVertical size={13} />
        </button>
        <button
          className="flex flex-1 items-center gap-1 text-left text-2xs-plus text-[var(--text-primary)]"
          onClick={() => setExpanded((v) => !v)}
        >
          <ChevronDown size={12} className={cn("shrink-0 text-[var(--text-tertiary)] transition-transform", !expanded && "-rotate-90")} />
          {definition.label}
        </button>
        <Switch checked={instance.enabled} onCheckedChange={() => toggleEffect(targetId, instance.id)} />
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
          onClick={() => removeEffect(targetId, instance.id)}
          aria-label="Remove effect"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-[var(--surface-border)] px-2.5 py-2">
          <Field label="Blend mode">
            <SelectControl
              value={instance.blendMode}
              options={BLEND_MODE_OPTIONS}
              onChange={(blendMode) => {
                setEffectBlendMode(targetId, instance.id, blendMode as BlendMode);
              }}
            />
          </Field>
          <Field label="Mix">
            <SliderControl
              value={instance.mix}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => setEffectMix(targetId, instance.id, v, true)}
              onCommit={commitHistory}
            />
          </Field>
          {hasTimeParam && (
            <Field label="Speed">
              <SliderControl
                value={instance.speed}
                min={0}
                max={4}
                step={0.05}
                onChange={(v) => setEffectSpeed(targetId, instance.id, v, true)}
                onCommit={commitHistory}
              />
            </Field>
          )}
          {definition.params.map((paramSchema) => (
            <EffectParamControl
              key={paramSchema.key}
              schema={paramSchema}
              value={instance.params[paramSchema.key]}
              onChange={(key, value, coalesce) => setEffectParam(targetId, instance.id, key, value, coalesce)}
              onCommit={commitHistory}
              onPickImage={() => {
                setPickingParamKey(paramSchema.key);
                fileInputRef.current?.click();
              }}
            />
          ))}
        </div>
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
          useEditorStore.getState().addImageAsset(asset);
          setEffectParam(targetId, instance.id, pickingParamKey, asset.id);
          commitHistory();
          setPickingParamKey(null);
        }}
      />
    </div>
  );
}
