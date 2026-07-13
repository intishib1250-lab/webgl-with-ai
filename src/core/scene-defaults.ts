import { createId } from "./id";
import { createEffectDefaultParams, getEffectDefinition } from "../effects/registry";
import {
  ArtboardPreset,
  EffectLayer,
  GradientLayer,
  ImageLayer,
  Layer,
  Model3DLayer,
  Model3DPrimitive,
  SCENE_SCHEMA_VERSION,
  Scene,
  ShapeLayer,
  TextLayer,
} from "./scene-types";

export const ARTBOARD_PRESETS: Record<Exclude<ArtboardPreset, "custom">, { width: number; height: number }> = {
  "1920x1080": { width: 1920, height: 1080 },
  "1080x1080": { width: 1080, height: 1080 },
  "1080x1920": { width: 1080, height: 1920 },
};

export function createDefaultScene(): Scene {
  return {
    schemaVersion: SCENE_SCHEMA_VERSION,
    id: createId("scene"),
    name: "Untitled Scene",
    size: { width: 1920, height: 1080, preset: "1920x1080" },
    background: { fill: { type: "solid", color: "#0b0b0cff" } },
    layers: [],
    effects: [],
    assets: [],
    animationSpeed: 1,
  };
}

function baseLayer(name: string) {
  return {
    id: createId("layer"),
    name,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal" as const,
    transform: { x: 0, y: 0, scale: 1, rotationDeg: 0 },
    effects: [],
  };
}

export function createImageLayer(scene: Scene, name = "Image"): ImageLayer {
  return {
    ...baseLayer(name),
    type: "image",
    assetId: null,
    naturalWidth: scene.size.width,
    naturalHeight: scene.size.height,
    width: scene.size.width,
    height: scene.size.height,
    transform: { x: scene.size.width / 2, y: scene.size.height / 2, scale: 1, rotationDeg: 0 },
  };
}

export function createTextLayer(scene: Scene, content = "Text"): TextLayer {
  return {
    ...baseLayer("Text"),
    type: "text",
    content,
    fontFamily: "Inter",
    fontWeight: 600,
    fontSize: 120,
    letterSpacing: 0,
    lineHeight: 1.1,
    align: "center",
    fill: { type: "solid", color: "#ffffffff" },
    width: scene.size.width * 0.8,
    height: scene.size.height * 0.4,
    transform: { x: scene.size.width / 2, y: scene.size.height / 2, scale: 1, rotationDeg: 0 },
  };
}

const SHAPE_LABEL: Record<ShapeLayer["shape"], string> = {
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  plane: "Plane",
  polygon: "Polygon",
};

export function createShapeLayer(scene: Scene, shape: ShapeLayer["shape"] = "rectangle"): ShapeLayer {
  return {
    ...baseLayer(SHAPE_LABEL[shape]),
    type: "shape",
    shape,
    cornerRadius: 0,
    sides: 6,
    fill: { type: "solid", color: "#ff7a33ff" },
    width: scene.size.width * 0.4,
    height: scene.size.height * 0.4,
    transform: { x: scene.size.width / 2, y: scene.size.height / 2, scale: 1, rotationDeg: 0 },
  };
}

export function createGradientLayer(scene: Scene): GradientLayer {
  return {
    ...baseLayer("Gradient"),
    type: "gradient",
    gradient: {
      kind: "linear",
      angleDeg: 45,
      stops: [
        { offset: 0, color: "#ff7a33ff" },
        { offset: 1, color: "#1a0f08ff" },
      ],
    },
    width: scene.size.width,
    height: scene.size.height,
    transform: { x: scene.size.width / 2, y: scene.size.height / 2, scale: 1, rotationDeg: 0 },
  };
}

export const MODEL3D_LABEL: Record<Model3DPrimitive, string> = {
  torus: "Torus",
  box: "Box",
  sphere: "Sphere",
  capsule: "Capsule",
  disc: "Disc",
  cylinder: "Cylinder",
  octahedron: "Octahedron",
  hexPrism: "Hex Prism",
  plus: "Plus",
  spring: "Spring",
  tricylinder: "Tricylinder",
  triangle: "Triangle",
  roundedCross: "Rounded Cross",
  roundedBox: "Rounded Rect",
  mergedDiscs: "Merged Discs",
  rippledSphere: "Rippled Sphere",
  top: "Top",
  star: "Star",
  pyramid: "Pyramid",
  asterisk: "Asterisk",
  dodecahedron: "Dodecahedron",
  boxFrame: "Box Frame",
  custom: "Custom",
};

export function createModel3DLayer(scene: Scene, primitive: Model3DPrimitive = "sphere"): Model3DLayer {
  return {
    ...baseLayer(MODEL3D_LABEL[primitive]),
    type: "model3d",
    primitive,
    width: scene.size.width * 0.4,
    height: scene.size.width * 0.4,
    transform: { x: scene.size.width / 2, y: scene.size.height / 2, scale: 1, rotationDeg: 0 },
    rotation3d: { x: 180, y: 180, z: 180 },
    fov: 50,
    scale3d: 0.5,
    twist: { x: 0, y: 0 },
    rounding: 0,
    variation: 0.5,
    smoothing: 0.2,
    extrude: 0.25,
    mix: 1,
    showBackground: true,
    customMapAssetId: null,

    repeatType: "none",
    repeatSpacing: 0.5,

    refraction: { amount: 0.5, behavior: "refract", dispersion: 0.25, roughness: 0 },

    surfaceTexture: { type: "striped", amount: 0, scale: 0.4 },
    textureAssetId: null,
    material: { color: "#c9ccd1ff", roughness: 0.4, metalness: 0.1 },

    light: { positionX: 25, positionY: 25, positionZ: -30, specular: 0.5, fresnel: 0.5, color: "#ffffffff", opaqueness: 0 },

    animationSpeed: 0.5,
    animationDirection: { x: 0, y: 1, z: 0 },

    trackMouseAmount: 0,
    mouseAxes: "both",
    momentum: 0,
    spring: 0,
    interactiveTextureAmount: 0,
    axisTilt: 0,
  };
}

export function createEffectLayer(effectId: string): EffectLayer {
  const definition = getEffectDefinition(effectId);
  return {
    id: createId("layer"),
    type: "effect",
    name: definition?.label ?? "Effect",
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal",
    effectId,
    speed: 1,
    params: createEffectDefaultParams(effectId),
  };
}

export function cloneLayer(layer: Layer): Layer {
  const clone = structuredClone(layer);
  clone.id = createId("layer");
  clone.name = `${layer.name} copy`;
  if (clone.type !== "effect") {
    clone.effects = clone.effects.map((effect) => ({ ...effect, id: createId("effect") }));
  }
  return clone;
}
