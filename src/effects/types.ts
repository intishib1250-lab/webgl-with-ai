export type EffectCategory = "distort" | "stylize" | "blur" | "color";

interface ParamSchemaBase {
  key: string;
  label: string;
  description?: string;
}

export interface NumberParamSchema extends ParamSchemaBase {
  type: "number" | "angle";
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface BooleanParamSchema extends ParamSchemaBase {
  type: "boolean";
  default: boolean;
}

export interface ColorParamSchema extends ParamSchemaBase {
  type: "color";
  default: string;
}

export interface SelectParamSchema extends ParamSchemaBase {
  type: "select";
  options: { value: string; label: string }[];
  default: string;
}

export interface ImageParamSchema extends ParamSchemaBase {
  type: "image";
  default: null;
}

export type EffectParamSchema =
  | NumberParamSchema
  | BooleanParamSchema
  | ColorParamSchema
  | SelectParamSchema
  | ImageParamSchema;

export interface EffectDefinition {
  id: string;
  label: string;
  category: EffectCategory;
  /** Full GLSL ES 3.00 fragment shader source; built via buildEffectShader(). */
  fragmentShader: string;
  params: EffectParamSchema[];
  /** Renderer maintains a persistent feedback trail texture (mouse-follow). */
  needsTrailBuffer?: boolean;
}

export function defaultParamsFor(definition: EffectDefinition): Record<string, number | string | boolean> {
  const defaults: Record<string, number | string | boolean> = {};
  for (const param of definition.params) {
    if (param.type === "image") continue;
    defaults[param.key] = param.default;
  }
  return defaults;
}
