import { create } from "zustand";
import { createId } from "../core/id";
import {
  ARTBOARD_PRESETS,
  cloneLayer,
  createDefaultScene,
  createEffectLayer,
  createGradientLayer,
  createImageLayer,
  createModel3DLayer,
  createShapeLayer,
  createTextLayer,
} from "../core/scene-defaults";
import {
  ArtboardPreset,
  BlendMode,
  EffectInstance,
  Fill,
  ImageAsset,
  Layer,
  LayerTransform,
  Model3DPrimitive,
  Scene,
  ShapeKind,
} from "../core/scene-types";
import { createEffectDefaultParams } from "../effects/registry";

export type EditorMode = "edit" | "play";
export type EffectTargetKind = "layer" | "scene";

const HISTORY_LIMIT = 100;
const COALESCE_WINDOW_MS = 500;

let coalesceState: { key: string; timer: ReturnType<typeof setTimeout> } | null = null;

interface HistoryEntry {
  scene: Scene;
}

interface EditorState {
  scene: Scene;
  selectedLayerId: string | null;
  mode: EditorMode;
  zoom: number;
  panX: number;
  panY: number;
  resolutionScale: number;
  past: HistoryEntry[];
  future: HistoryEntry[];

  // selection / mode
  selectLayer: (layerId: string | null) => void;
  setMode: (mode: EditorMode) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setResolutionScale: (scale: number) => void;

  // scene
  setSceneName: (name: string) => void;
  setSceneSize: (preset: ArtboardPreset, custom?: { width: number; height: number }) => void;
  setSceneBackground: (fill: Fill) => void;
  setAnimationSpeed: (speed: number) => void;

  // assets
  addImageAsset: (asset: ImageAsset) => void;

  // layers
  addLayer: (type: Layer["type"], options?: { shape?: ShapeKind; effectId?: string; primitive?: Model3DPrimitive }) => string;
  addImageLayerFromAsset: (asset: ImageAsset) => string;
  removeLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  reorderLayer: (layerId: string, toIndex: number) => void;
  renameLayer: (layerId: string, name: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  setLayerBlendMode: (layerId: string, mode: BlendMode) => void;
  setLayerOpacity: (layerId: string, opacity: number, coalesce?: boolean) => void;
  updateLayerTransform: (layerId: string, partial: Partial<LayerTransform>, coalesce?: boolean) => void;
  updateLayer: (layerId: string, updater: (layer: Layer) => Layer, coalesce?: string) => void;

  // effects (targetId is a layerId or "scene")
  addEffect: (targetId: string, effectId: string) => void;
  removeEffect: (targetId: string, effectInstanceId: string) => void;
  reorderEffect: (targetId: string, effectInstanceId: string, toIndex: number) => void;
  toggleEffect: (targetId: string, effectInstanceId: string) => void;
  setEffectSpeed: (targetId: string, effectInstanceId: string, speed: number, coalesce?: boolean) => void;
  setEffectBlendMode: (targetId: string, effectInstanceId: string, blendMode: BlendMode) => void;
  setEffectMix: (targetId: string, effectInstanceId: string, mix: number, coalesce?: boolean) => void;
  setEffectParam: (targetId: string, effectInstanceId: string, key: string, value: number | string | boolean, coalesce?: boolean) => void;

  // history
  undo: () => void;
  redo: () => void;
  commitHistory: () => void;

  // persistence / project
  loadScene: (scene: Scene) => void;
  resetScene: () => void;
}

function getEffectsList(scene: Scene, targetId: string): EffectInstance[] {
  if (targetId === "scene") return scene.effects;
  const layer = scene.layers.find((l) => l.id === targetId);
  return layer && layer.type !== "effect" ? layer.effects : [];
}

function withEffectsList(scene: Scene, targetId: string, updater: (effects: EffectInstance[]) => EffectInstance[]): Scene {
  if (targetId === "scene") {
    return { ...scene, effects: updater(scene.effects) };
  }
  return {
    ...scene,
    layers: scene.layers.map((layer) =>
      layer.id === targetId && layer.type !== "effect" ? { ...layer, effects: updater(layer.effects) } : layer,
    ),
  };
}

export const useEditorStore = create<EditorState>((set, get) => {
  function mutateScene(recipe: (scene: Scene) => Scene, coalesceKey?: string) {
    const state = get();
    const shouldCoalesce = coalesceKey && coalesceState?.key === coalesceKey;

    if (!shouldCoalesce) {
      const past = [...state.past, { scene: state.scene }].slice(-HISTORY_LIMIT);
      set({ past, future: [] });
    } else {
      set({ future: [] });
    }

    if (coalesceKey) {
      if (coalesceState?.timer) clearTimeout(coalesceState.timer);
      coalesceState = {
        key: coalesceKey,
        timer: setTimeout(() => {
          coalesceState = null;
        }, COALESCE_WINDOW_MS),
      };
    } else {
      coalesceState = null;
    }

    set({ scene: recipe(get().scene) });
  }

  return {
    scene: createDefaultScene(),
    selectedLayerId: null,
    mode: "edit",
    zoom: 1,
    panX: 0,
    panY: 0,
    resolutionScale: 1,
    past: [],
    future: [],

    selectLayer: (layerId) => set({ selectedLayerId: layerId }),
    setMode: (mode) => set({ mode }),
    setZoom: (zoom) => set({ zoom: Math.min(4, Math.max(0.1, zoom)) }),
    setPan: (x, y) => set({ panX: x, panY: y }),
    setResolutionScale: (scale) => set({ resolutionScale: scale }),

    setSceneName: (name) => mutateScene((scene) => ({ ...scene, name })),

    setSceneSize: (preset, custom) =>
      mutateScene((scene) => {
        if (preset === "custom") {
          const width = custom?.width ?? scene.size.width;
          const height = custom?.height ?? scene.size.height;
          return { ...scene, size: { width, height, preset } };
        }
        return { ...scene, size: { ...ARTBOARD_PRESETS[preset], preset } };
      }),

    setSceneBackground: (fill) => mutateScene((scene) => ({ ...scene, background: { fill } })),

    setAnimationSpeed: (speed) => mutateScene((scene) => ({ ...scene, animationSpeed: speed }), "scene.animationSpeed"),

    addImageAsset: (asset) => mutateScene((scene) => ({ ...scene, assets: [...scene.assets, asset] })),

    addLayer: (type, options) => {
      const scene = get().scene;
      let layer: Layer;
      if (type === "image") layer = createImageLayer(scene);
      else if (type === "text") layer = createTextLayer(scene);
      else if (type === "shape") layer = createShapeLayer(scene, options?.shape ?? "rectangle");
      else if (type === "gradient") layer = createGradientLayer(scene);
      else if (type === "model3d") layer = createModel3DLayer(scene, options?.primitive ?? "sphere");
      else layer = createEffectLayer(options?.effectId ?? "noise");

      mutateScene((s) => ({ ...s, layers: [...s.layers, layer] }));
      set({ selectedLayerId: layer.id });
      return layer.id;
    },

    addImageLayerFromAsset: (asset) => {
      const scene = get().scene;
      const layer = createImageLayer(scene, asset.name);
      layer.assetId = asset.id;
      layer.naturalWidth = asset.width;
      layer.naturalHeight = asset.height;
      const aspect = asset.width / asset.height;
      const targetWidth = Math.min(scene.size.width * 0.8, asset.width);
      layer.width = targetWidth;
      layer.height = targetWidth / aspect;
      mutateScene((s) => ({ ...s, assets: s.assets.some((a) => a.id === asset.id) ? s.assets : [...s.assets, asset], layers: [...s.layers, layer] }));
      set({ selectedLayerId: layer.id });
      return layer.id;
    },

    removeLayer: (layerId) => {
      mutateScene((scene) => ({ ...scene, layers: scene.layers.filter((l) => l.id !== layerId) }));
      if (get().selectedLayerId === layerId) set({ selectedLayerId: null });
    },

    duplicateLayer: (layerId) => {
      const scene = get().scene;
      const index = scene.layers.findIndex((l) => l.id === layerId);
      if (index === -1) return;
      const clone = cloneLayer(scene.layers[index]);
      mutateScene((s) => {
        const layers = [...s.layers];
        layers.splice(index + 1, 0, clone);
        return { ...s, layers };
      });
      set({ selectedLayerId: clone.id });
    },

    reorderLayer: (layerId, toIndex) =>
      mutateScene((scene) => {
        const layers = [...scene.layers];
        const fromIndex = layers.findIndex((l) => l.id === layerId);
        if (fromIndex === -1) return scene;
        const [moved] = layers.splice(fromIndex, 1);
        layers.splice(Math.max(0, Math.min(layers.length, toIndex)), 0, moved);
        return { ...scene, layers };
      }),

    renameLayer: (layerId, name) =>
      mutateScene((scene) => ({ ...scene, layers: scene.layers.map((l) => (l.id === layerId ? { ...l, name } : l)) })),

    toggleLayerVisibility: (layerId) =>
      mutateScene((scene) => ({
        ...scene,
        layers: scene.layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)),
      })),

    toggleLayerLock: (layerId) =>
      mutateScene((scene) => ({
        ...scene,
        layers: scene.layers.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l)),
      })),

    setLayerBlendMode: (layerId, mode) =>
      mutateScene((scene) => ({
        ...scene,
        layers: scene.layers.map((l) => (l.id === layerId ? { ...l, blendMode: mode } : l)),
      })),

    setLayerOpacity: (layerId, opacity, coalesce) =>
      mutateScene(
        (scene) => ({ ...scene, layers: scene.layers.map((l) => (l.id === layerId ? { ...l, opacity } : l)) }),
        coalesce ? `layer.${layerId}.opacity` : undefined,
      ),

    updateLayerTransform: (layerId, partial, coalesce) =>
      mutateScene(
        (scene) => ({
          ...scene,
          layers: scene.layers.map((l) =>
            l.id === layerId && l.type !== "effect" ? { ...l, transform: { ...l.transform, ...partial } } : l,
          ),
        }),
        coalesce ? `layer.${layerId}.transform` : undefined,
      ),

    updateLayer: (layerId, updater, coalesce) =>
      mutateScene(
        (scene) => ({ ...scene, layers: scene.layers.map((l) => (l.id === layerId ? updater(l) : l)) }),
        coalesce,
      ),

    addEffect: (targetId, effectId) => {
      const instance: EffectInstance = {
        id: createId("effect"),
        effectId,
        enabled: true,
        speed: 1,
        blendMode: "normal",
        mix: 1,
        params: createEffectDefaultParams(effectId),
      };
      mutateScene((scene) => withEffectsList(scene, targetId, (effects) => [...effects, instance]));
    },

    removeEffect: (targetId, effectInstanceId) =>
      mutateScene((scene) => withEffectsList(scene, targetId, (effects) => effects.filter((e) => e.id !== effectInstanceId))),

    reorderEffect: (targetId, effectInstanceId, toIndex) =>
      mutateScene((scene) =>
        withEffectsList(scene, targetId, (effects) => {
          const list = [...effects];
          const fromIndex = list.findIndex((e) => e.id === effectInstanceId);
          if (fromIndex === -1) return effects;
          const [moved] = list.splice(fromIndex, 1);
          list.splice(Math.max(0, Math.min(list.length, toIndex)), 0, moved);
          return list;
        }),
      ),

    toggleEffect: (targetId, effectInstanceId) =>
      mutateScene((scene) =>
        withEffectsList(scene, targetId, (effects) =>
          effects.map((e) => (e.id === effectInstanceId ? { ...e, enabled: !e.enabled } : e)),
        ),
      ),

    setEffectSpeed: (targetId, effectInstanceId, speed, coalesce) =>
      mutateScene(
        (scene) =>
          withEffectsList(scene, targetId, (effects) => effects.map((e) => (e.id === effectInstanceId ? { ...e, speed } : e))),
        coalesce ? `effect.${effectInstanceId}.speed` : undefined,
      ),

    setEffectBlendMode: (targetId, effectInstanceId, blendMode) =>
      mutateScene((scene) =>
        withEffectsList(scene, targetId, (effects) => effects.map((e) => (e.id === effectInstanceId ? { ...e, blendMode } : e))),
      ),

    setEffectMix: (targetId, effectInstanceId, mix, coalesce) =>
      mutateScene(
        (scene) => withEffectsList(scene, targetId, (effects) => effects.map((e) => (e.id === effectInstanceId ? { ...e, mix } : e))),
        coalesce ? `effect.${effectInstanceId}.mix` : undefined,
      ),

    setEffectParam: (targetId, effectInstanceId, key, value, coalesce) =>
      mutateScene(
        (scene) =>
          withEffectsList(scene, targetId, (effects) =>
            effects.map((e) => (e.id === effectInstanceId ? { ...e, params: { ...e.params, [key]: value } } : e)),
          ),
        coalesce ? `effect.${effectInstanceId}.${key}` : undefined,
      ),

    undo: () => {
      const state = get();
      if (state.past.length === 0) return;
      const previous = state.past[state.past.length - 1];
      set({
        scene: previous.scene,
        past: state.past.slice(0, -1),
        future: [{ scene: state.scene }, ...state.future],
      });
      coalesceState = null;
    },

    redo: () => {
      const state = get();
      if (state.future.length === 0) return;
      const next = state.future[0];
      set({
        scene: next.scene,
        future: state.future.slice(1),
        past: [...state.past, { scene: state.scene }],
      });
      coalesceState = null;
    },

    commitHistory: () => {
      coalesceState = null;
    },

    loadScene: (scene) => set({ scene, selectedLayerId: null, past: [], future: [] }),
    resetScene: () => set({ scene: createDefaultScene(), selectedLayerId: null, past: [], future: [] }),
  };
});

export function getSelectedLayer(state: EditorState): Layer | null {
  return state.scene.layers.find((l) => l.id === state.selectedLayerId) ?? null;
}
