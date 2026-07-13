import { sceneHasAnimatedEffects } from "../core/animation-need";
import { Renderer } from "../core/renderer";
import { Scene } from "../core/scene-types";

/**
 * Framework-free scene mount shared by the editor's live preview export path
 * and the standalone embed runtime. Loads image assets from their inline
 * data URLs (scenes are fully self-contained), then drives a render loop
 * that only spins while something is actually animating.
 */
export function mountShaderfieldScene(container: HTMLElement, scene: Scene): () => void {
  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  container.style.position ||= "relative";
  container.appendChild(canvas);

  const renderer = new Renderer(canvas);

  let disposed = false;
  for (const asset of scene.assets) {
    const image = new Image();
    image.onload = () => {
      if (!disposed) renderer.syncAsset(asset, image);
    };
    image.src = asset.dataUrl;
  }

  const mouseUv = { x: 0.5, y: 0.5 };
  const mouseVelocity = { x: 0, y: 0 };
  let lastMoveAt: number | null = null;

  function onPointerMove(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    const now = performance.now();
    if (lastMoveAt != null) {
      const dt = Math.max(0.001, (now - lastMoveAt) / 1000);
      mouseVelocity.x = (x - mouseUv.x) / dt;
      mouseVelocity.y = (y - mouseUv.y) / dt;
    }
    lastMoveAt = now;
    mouseUv.x = x;
    mouseUv.y = y;
  }
  container.addEventListener("pointermove", onPointerMove);

  let time = 0;
  let lastFrameAt: number | null = null;
  let rafHandle: number | null = null;
  const resolutionScale = Math.min(2, window.devicePixelRatio || 1);

  function frame(now: number) {
    rafHandle = requestAnimationFrame(frame);
    const dtMs = lastFrameAt == null ? 16 : now - lastFrameAt;
    lastFrameAt = now;
    const dt = Math.min(0.1, Math.max(0, dtMs / 1000));

    if (!sceneHasAnimatedEffects(scene)) return;

    time += dt * scene.animationSpeed;
    renderer.render(scene, { time, dt, mouseUv, mouseVelocity, renderScale: resolutionScale });
    mouseVelocity.x *= 0.85;
    mouseVelocity.y *= 0.85;
  }

  // First frame renders immediately even for fully static scenes.
  renderer.render(scene, { time: 0, dt: 0, mouseUv, mouseVelocity, renderScale: resolutionScale });
  rafHandle = requestAnimationFrame(frame);

  return function unmount() {
    disposed = true;
    if (rafHandle != null) cancelAnimationFrame(rafHandle);
    container.removeEventListener("pointermove", onPointerMove);
    renderer.dispose();
    container.removeChild(canvas);
  };
}
