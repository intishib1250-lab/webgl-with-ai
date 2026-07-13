import { Scene } from "./scene-types";

/** Effects that visibly change over time and require a continuous render loop. */
export const ANIMATED_EFFECT_IDS = new Set(["noise", "wave", "liquid", "ripple", "mouseFollow"]);

export function sceneHasAnimatedEffects(scene: Scene): boolean {
  const hasAnimated = (effects: Scene["effects"]) => effects.some((e) => e.enabled && ANIMATED_EFFECT_IDS.has(e.effectId));
  if (hasAnimated(scene.effects)) return true;
  return scene.layers.some((layer) => {
    if (!layer.visible) return false;
    if (layer.type === "effect") return ANIMATED_EFFECT_IDS.has(layer.effectId);
    if (layer.type === "model3d") return layer.animationSpeed !== 0 || layer.trackMouseAmount > 0;
    return hasAnimated(layer.effects);
  });
}
