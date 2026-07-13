import { createModel3DLayer } from "@/core/scene-defaults";
import { Model3DLayer, Model3DPrimitive, SCENE_SCHEMA_VERSION, Scene } from "@/core/scene-types";

const STORAGE_KEY = "shaderfield.project.v1";
const AUTOSAVE_DEBOUNCE_MS = 600;

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleAutosave(scene: Scene): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scene));
    } catch {
      // storage full or unavailable — autosave is best-effort
    }
  }, AUTOSAVE_DEBOUNCE_MS);
}

export function loadAutosavedScene(): Scene | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrateScene(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearAutosave(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Backfills fields added after schemaVersion 1 shipped, so older saves don't crash. */
function backfillEffectInstance<T extends { blendMode?: unknown; mix?: unknown }>(effect: T): T {
  return { ...effect, blendMode: effect.blendMode ?? "normal", mix: effect.mix ?? 1 };
}

/** Repeat Spacing and Surface Texture Scale switched from raw world-space values to 0..1 UI fractions — old saves stored the raw value directly, which is always > 1 in practice, so anything above that threshold is legacy and gets rescaled back into 0..1. */
function normalizeLegacyFraction(value: number, legacyMin: number, legacyMax: number): number {
  if (value <= 1) return value;
  return Math.min(1, Math.max(0, (value - legacyMin) / (legacyMax - legacyMin)));
}

/** Model3DLayer's shape grew substantially after it first shipped — rebuild from defaults, keeping placement/identity. */
function backfillModel3DLayer(layer: Model3DLayer, scene: Scene): Model3DLayer {
  const isFreshShape = typeof (layer as unknown as { scale3d?: unknown }).scale3d === "number";
  const base = isFreshShape
    ? layer
    : (() => {
        const legacy = layer as unknown as { primitive?: Model3DPrimitive };
        const fresh = createModel3DLayer(scene, legacy.primitive ?? "sphere");
        return {
          ...fresh,
          id: layer.id,
          name: layer.name,
          visible: layer.visible,
          locked: layer.locked,
          opacity: layer.opacity,
          blendMode: layer.blendMode ?? "normal",
          transform: layer.transform,
          width: layer.width ?? fresh.width,
          height: layer.height ?? fresh.height,
          effects: (layer.effects ?? []).map(backfillEffectInstance),
        };
      })();

  return {
    ...base,
    repeatSpacing: normalizeLegacyFraction(base.repeatSpacing, 0.3, 6),
    surfaceTexture: { ...base.surfaceTexture, scale: normalizeLegacyFraction(base.surfaceTexture.scale, 0.1, 4) },
  };
}

function migrateScene(scene: Scene): Scene {
  return {
    ...scene,
    schemaVersion: SCENE_SCHEMA_VERSION,
    effects: scene.effects.map(backfillEffectInstance),
    layers: scene.layers.map((layer) => {
      if (layer.type === "effect") return { ...layer, blendMode: layer.blendMode ?? "normal" };
      if (layer.type === "shape") return { ...layer, sides: layer.sides ?? 6, effects: layer.effects.map(backfillEffectInstance) };
      if (layer.type === "model3d") return backfillModel3DLayer(layer, scene);
      return { ...layer, effects: layer.effects.map(backfillEffectInstance) };
    }),
  };
}

export function downloadProjectJson(scene: Scene): void {
  const blob = new Blob([JSON.stringify(scene, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(scene.name)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseProjectJsonFile(file: File): Promise<Scene> {
  return file.text().then((text) => migrateScene(JSON.parse(text)));
}

export function sanitizeFilename(name: string): string {
  return name.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "untitled-scene";
}
