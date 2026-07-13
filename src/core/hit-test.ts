import { invert, layerModelMatrix, transformPoint } from "./mat3";
import { Layer, Scene } from "./scene-types";

/** Returns the topmost visible, unlocked layer whose bounds contain the scene-space point, if any. */
export function hitTestLayers(scene: Scene, point: { x: number; y: number }): Layer | null {
  for (let i = scene.layers.length - 1; i >= 0; i--) {
    const layer = scene.layers[i];
    if (!layer.visible || layer.locked || layer.type === "effect") continue;
    const model = layerModelMatrix({
      x: layer.transform.x,
      y: layer.transform.y,
      width: layer.width,
      height: layer.height,
      rotationDeg: layer.transform.rotationDeg,
      scale: layer.transform.scale,
    });
    const inverseModel = invert(model);
    const [localX, localY] = transformPoint(inverseModel, point.x, point.y);
    if (Math.abs(localX) <= 1 && Math.abs(localY) <= 1) return layer;
  }
  return null;
}
