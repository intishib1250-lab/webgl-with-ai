import { useCallback, useEffect, useRef } from "react";
import { sceneHasAnimatedEffects } from "@/core/animation-need";
import { globalClock } from "@/core/global-clock";
import { Renderer } from "@/core/renderer";
import { useEditorStore } from "@/state/store";

export function useRenderLoop(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const rendererRef = useRef<Renderer | null>(null);
  const mouseUvRef = useRef({ x: 0.5, y: 0.5 });
  const mouseVelocityRef = useRef({ x: 0, y: 0 });
  const lastMouseMoveAtRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const lastFrameAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const needsRenderRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new Renderer(canvas);
    rendererRef.current = renderer;
    needsRenderRef.current = true;
    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () =>
      useEditorStore.subscribe(() => {
        needsRenderRef.current = true;
      }),
    [],
  );

  useEffect(() => {
    function frame(now: number) {
      rafRef.current = requestAnimationFrame(frame);
      const renderer = rendererRef.current;
      if (!renderer) return;

      const state = useEditorStore.getState();
      const dtMs = lastFrameAtRef.current == null ? 16 : now - lastFrameAtRef.current;
      lastFrameAtRef.current = now;
      const dt = Math.min(0.1, Math.max(0, dtMs / 1000));

      const animating = state.mode === "play" || sceneHasAnimatedEffects(state.scene);
      if (!animating && !needsRenderRef.current) return;
      needsRenderRef.current = false;

      timeRef.current += dt * state.scene.animationSpeed;
      globalClock.time = timeRef.current;
      globalClock.mouseUv = mouseUvRef.current;
      globalClock.mouseVelocity = mouseVelocityRef.current;

      renderer.render(state.scene, {
        time: timeRef.current,
        dt,
        mouseUv: mouseUvRef.current,
        mouseVelocity: mouseVelocityRef.current,
        renderScale: state.resolutionScale,
      });

      mouseVelocityRef.current = {
        x: mouseVelocityRef.current.x * 0.85,
        y: mouseVelocityRef.current.y * 0.85,
      };
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const updateMouse = useCallback((uv: { x: number; y: number }) => {
    const now = performance.now();
    const prevAt = lastMouseMoveAtRef.current;
    const prevUv = mouseUvRef.current;
    if (prevAt != null) {
      const dt = Math.max(0.001, (now - prevAt) / 1000);
      mouseVelocityRef.current = { x: (uv.x - prevUv.x) / dt, y: (uv.y - prevUv.y) / dt };
    }
    lastMouseMoveAtRef.current = now;
    mouseUvRef.current = uv;
    needsRenderRef.current = true;
  }, []);

  const requestRender = useCallback(() => {
    needsRenderRef.current = true;
  }, []);

  return { rendererRef, updateMouse, requestRender };
}
