import { globalClock } from "@/core/global-clock";
import { Renderer } from "@/core/renderer";
import { Scene } from "@/core/scene-types";
import { loadAssetImageElement } from "./image-asset";
import { sanitizeFilename } from "@/state/persistence";

export async function renderSceneToCanvas(scene: Scene, exportScale = 2): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  const renderer = new Renderer(canvas);

  for (const asset of scene.assets) {
    try {
      const image = await loadAssetImageElement(asset);
      renderer.syncAsset(asset, image);
    } catch {
      // skip assets that fail to decode
    }
  }

  renderer.render(scene, {
    time: globalClock.time,
    dt: 0,
    mouseUv: globalClock.mouseUv,
    mouseVelocity: { x: 0, y: 0 },
    renderScale: exportScale,
  });

  renderer.dispose();
  return canvas;
}

export async function exportScenePng(scene: Scene, exportScale = 2): Promise<void> {
  const canvas = await renderSceneToCanvas(scene, exportScale);
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(scene.name)}.png`;
  link.click();
  URL.revokeObjectURL(url);
}
