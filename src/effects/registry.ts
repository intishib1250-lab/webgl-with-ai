import { EFFECT_DEFINITIONS } from "./definitions";
import { EffectDefinition, defaultParamsFor } from "./types";

const REGISTRY = new Map<string, EffectDefinition>(EFFECT_DEFINITIONS.map((def) => [def.id, def]));

export function getEffectDefinition(effectId: string): EffectDefinition | undefined {
  return REGISTRY.get(effectId);
}

export function listEffectDefinitions(): EffectDefinition[] {
  return EFFECT_DEFINITIONS;
}

export function createEffectDefaultParams(effectId: string): Record<string, number | string | boolean> {
  const def = getEffectDefinition(effectId);
  return def ? defaultParamsFor(def) : {};
}

export { EFFECT_DEFINITIONS };
export type { EffectDefinition } from "./types";
