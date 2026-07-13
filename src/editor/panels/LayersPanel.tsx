import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Circle, Copy, Eye, EyeOff, ImageIcon, Lock, Sparkles, Square, Trash2, Type, Unlock, Waves } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Layer } from "@/core/scene-types";
import { useEditorStore } from "@/state/store";
import { AddLayerMenu } from "./AddLayerMenu";

const TYPE_ICON: Record<Layer["type"], typeof ImageIcon> = {
  image: ImageIcon,
  text: Type,
  shape: Square,
  gradient: Waves,
  effect: Sparkles,
  model3d: Box,
};

export function LayersPanel() {
  const scene = useEditorStore((s) => s.scene);
  const reorderLayer = useEditorStore((s) => s.reorderLayer);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // Layers render bottom-to-top in the scene; show top-to-bottom in the panel like most editors.
  const displayOrder = [...scene.layers].reverse();

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const overDisplayIndex = displayOrder.findIndex((l) => l.id === over.id);
    const toIndex = scene.layers.length - 1 - overDisplayIndex;
    reorderLayer(String(active.id), toIndex);
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <h2 className="text-2xs-plus font-medium text-foreground">Layers</h2>
        <AddLayerMenu />
      </div>

      <div className="overflow-y-auto p-1.5">
        {displayOrder.length === 0 && (
          <p className="px-2 py-6 text-center text-2xs-plus text-muted-foreground">
            No layers yet. Drag an image onto the canvas or use the toolbar below.
          </p>
        )}
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext items={displayOrder.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-0.5">
              {displayOrder.map((layer) => (
                <LayerRow key={layer.id} layer={layer} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function LayerRow({ layer }: { layer: Layer }) {
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const selectLayer = useEditorStore((s) => s.selectLayer);
  const renameLayer = useEditorStore((s) => s.renameLayer);
  const toggleLayerVisibility = useEditorStore((s) => s.toggleLayerVisibility);
  const toggleLayerLock = useEditorStore((s) => s.toggleLayerLock);
  const duplicateLayer = useEditorStore((s) => s.duplicateLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(layer.name);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: layer.id });
  const Icon = TYPE_ICON[layer.type];
  const isSelected = selectedLayerId === layer.id;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-1.5 rounded-md px-1.5 py-1.5 text-2xs-plus",
        isSelected ? "bg-[var(--brand-muted)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
        isDragging && "opacity-60",
      )}
      onClick={() => selectLayer(layer.id)}
    >
      <button className="cursor-grab touch-none text-[var(--text-tertiary)]" {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <circle cx="2.5" cy="2.5" r="1.2" />
          <circle cx="7.5" cy="2.5" r="1.2" />
          <circle cx="2.5" cy="7" r="1.2" />
          <circle cx="7.5" cy="7" r="1.2" />
          <circle cx="2.5" cy="11.5" r="1.2" />
          <circle cx="7.5" cy="11.5" r="1.2" />
        </svg>
      </button>

      <Icon size={13} className="shrink-0 text-[var(--text-tertiary)]" />

      {editingName ? (
        <input
          autoFocus
          className="min-w-0 flex-1 rounded-sm bg-[var(--surface-1)] px-1 py-0.5 outline-none"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => {
            setEditingName(false);
            if (nameDraft.trim()) renameLayer(layer.id, nameDraft.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="min-w-0 flex-1 truncate"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setNameDraft(layer.name);
            setEditingName(true);
          }}
        >
          {layer.name}
        </span>
      )}

      <div className={cn("flex items-center gap-0.5", !isSelected && "opacity-0 group-hover:opacity-100")}>
        <button
          className="grid h-5 w-5 place-items-center rounded-sm hover:bg-[var(--surface-3)]"
          onClick={(e) => {
            e.stopPropagation();
            duplicateLayer(layer.id);
          }}
          aria-label="Duplicate layer"
        >
          <Copy size={11} />
        </button>
        <button
          className="grid h-5 w-5 place-items-center rounded-sm hover:bg-[var(--surface-3)]"
          onClick={(e) => {
            e.stopPropagation();
            removeLayer(layer.id);
          }}
          aria-label="Delete layer"
        >
          <Trash2 size={11} />
        </button>
      </div>

      <button
        className="grid h-5 w-5 shrink-0 place-items-center rounded-sm hover:bg-[var(--surface-3)]"
        onClick={(e) => {
          e.stopPropagation();
          toggleLayerLock(layer.id);
        }}
        aria-label={layer.locked ? "Unlock layer" : "Lock layer"}
      >
        {layer.locked ? <Lock size={11} /> : <Unlock size={11} className="opacity-0 group-hover:opacity-100" />}
      </button>
      <button
        className="grid h-5 w-5 shrink-0 place-items-center rounded-sm hover:bg-[var(--surface-3)]"
        onClick={(e) => {
          e.stopPropagation();
          toggleLayerVisibility(layer.id);
        }}
        aria-label={layer.visible ? "Hide layer" : "Show layer"}
      >
        {layer.visible ? <Eye size={12} /> : <EyeOff size={12} className="text-[var(--text-tertiary)]" />}
      </button>
    </div>
  );
}
