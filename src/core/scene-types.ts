export const SCENE_SCHEMA_VERSION = 1;

export type BlendMode =
  | "normal"
  | "add"
  | "subtract"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "colorDodge"
  | "colorBurn"
  | "linearBurn"
  | "hardLight"
  | "softLight"
  | "difference"
  | "exclusion"
  | "linearLight"
  | "pinLight"
  | "vividLight";

export type ArtboardPreset = "1920x1080" | "1080x1080" | "1080x1920" | "custom";

export interface ColorStop {
  offset: number; // 0..1
  color: string; // #rrggbbaa
}

export interface GradientFill {
  kind: "linear" | "radial" | "mesh";
  angleDeg: number; // used by linear
  stops: ColorStop[];
  /** mesh: four corner colors, TL/TR/BL/BR, overrides stops when kind === "mesh" */
  meshCorners?: [string, string, string, string];
  meshWarp?: number; // 0..1 organic distortion amount
}

export type Fill = { type: "solid"; color: string } | { type: "gradient"; gradient: GradientFill };

export interface SceneBackground {
  fill: Fill;
}

export interface SceneSize {
  width: number;
  height: number;
  preset: ArtboardPreset;
}

export interface LayerTransform {
  x: number; // center, canvas pixel space
  y: number;
  scale: number;
  rotationDeg: number;
}

export interface EffectInstance {
  id: string;
  effectId: string; // registry key
  enabled: boolean;
  speed: number; // per-effect global-clock speed multiplier
  blendMode: BlendMode; // how this effect's output combines with the stage before it
  mix: number; // 0..1, strength of that blend
  params: Record<string, number | string | boolean>;
}

interface LayerBase {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0..1
  blendMode: BlendMode;
  transform: LayerTransform;
  effects: EffectInstance[];
}

export interface ImageLayer extends LayerBase {
  type: "image";
  assetId: string | null;
  naturalWidth: number;
  naturalHeight: number;
  width: number;
  height: number;
}

export interface TextLayer extends LayerBase {
  type: "text";
  content: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  align: "left" | "center" | "right";
  fill: Fill;
  width: number;
  height: number;
}

export type ShapeKind = "rectangle" | "ellipse" | "plane" | "polygon";

export interface ShapeLayer extends LayerBase {
  type: "shape";
  shape: ShapeKind;
  cornerRadius: number;
  sides: number; // used when shape === "polygon"
  fill: Fill;
  width: number;
  height: number;
}

export interface GradientLayer extends LayerBase {
  type: "gradient";
  gradient: GradientFill;
  width: number;
  height: number;
}

/**
 * An effect treated as its own stack entry (adjustment-layer style): applies
 * as a post-process over the composite of every visible layer beneath it, up
 * to the next effect layer or the scene background. Unlike per-layer nested
 * effects (LayerBase.effects), this isn't attached to one piece of content —
 * its position in the stack IS its scope.
 */
export interface EffectLayer {
  id: string;
  type: "effect";
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0..1 wet/dry mix of the effect over the composite beneath it
  blendMode: BlendMode;
  effectId: string;
  speed: number;
  params: Record<string, number | string | boolean>;
}

export type Model3DPrimitive =
  | "torus"
  | "box"
  | "sphere"
  | "capsule"
  | "disc"
  | "cylinder"
  | "octahedron"
  | "hexPrism"
  | "plus"
  | "spring"
  | "tricylinder"
  | "triangle"
  | "roundedCross"
  | "roundedBox"
  | "mergedDiscs"
  | "rippledSphere"
  | "top"
  | "star"
  | "pyramid"
  | "asterisk"
  | "dodecahedron"
  | "boxFrame"
  | "custom";

export type Model3DRepeatType = "none" | "xy" | "x" | "y" | "xyz" | "radial" | "radial2";
export type MouseAxes = "x" | "y" | "both";
export type RefractBehavior = "refract" | "reflect";
export type SurfaceTextureType = "none" | "image" | "striped" | "wavy" | "beaded" | "diamond" | "linoleum";

export interface Model3DLayer extends LayerBase {
  type: "model3d";
  primitive: Model3DPrimitive;
  width: number;
  height: number;
  /** Object's own orientation, independent of the layer's 2D transform.rotationDeg. */
  rotation3d: { x: number; y: number; z: number }; // Axis
  fov: number;
  scale3d: number; // 0..~3, "Scale %" (1 = 100%)
  twist: { x: number; y: number };
  rounding: number; // 0..1
  variation: number; // 0..1, organic surface noise
  smoothing: number; // 0..1, smooth-blend radius for repeated/CSG copies
  extrude: number; // 0..1, stretch along Z / heightfield depth for custom shapes
  mix: number; // 0..1, overall deformation intensity (twist/rounding/variation applied at this strength)
  showBackground: boolean; // true = opaque scene-background fill where rays miss; false = transparent (composites with layers beneath)
  customMapAssetId: string | null; // heightfield image for the "custom" primitive

  repeatType: Model3DRepeatType;
  repeatSpacing: number;

  refraction: { amount: number; behavior: RefractBehavior; dispersion: number; roughness: number };

  surfaceTexture: { type: SurfaceTextureType; amount: number; scale: number };
  textureAssetId: string | null; // used when surfaceTexture.type === "image" (triplanar)
  material: { color: string; roughness: number; metalness: number };

  light: { positionX: number; positionY: number; positionZ: number; specular: number; fresnel: number; color: string; opaqueness: number };

  animationSpeed: number; // 0..1
  animationDirection: { x: number; y: number; z: number }; // per-axis rotation speed multipliers

  trackMouseAmount: number; // 0..1
  mouseAxes: MouseAxes;
  momentum: number; // 0..1
  spring: number; // 0..1, higher = snappier return
  interactiveTextureAmount: number; // 0..1, how much cursor speed drives surface texture phase
  axisTilt: number; // 0..1, how much cursor also tilts the rotation axis vs. simple orbit
}

export type Layer = ImageLayer | TextLayer | ShapeLayer | GradientLayer | EffectLayer | Model3DLayer;

export interface ImageAsset {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface Scene {
  schemaVersion: number;
  id: string;
  name: string;
  size: SceneSize;
  background: SceneBackground;
  layers: Layer[]; // bottom-to-top
  effects: EffectInstance[]; // scene-level, applied last
  assets: ImageAsset[];
  animationSpeed: number; // global clock multiplier
}

export function isImageLayer(layer: Layer): layer is ImageLayer {
  return layer.type === "image";
}
export function isTextLayer(layer: Layer): layer is TextLayer {
  return layer.type === "text";
}
export function isShapeLayer(layer: Layer): layer is ShapeLayer {
  return layer.type === "shape";
}
export function isGradientLayer(layer: Layer): layer is GradientLayer {
  return layer.type === "gradient";
}
export function isEffectLayer(layer: Layer): layer is EffectLayer {
  return layer.type === "effect";
}
export function isModel3DLayer(layer: Layer): layer is Model3DLayer {
  return layer.type === "model3d";
}
