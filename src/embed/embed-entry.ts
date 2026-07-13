import { Scene } from "../core/scene-types";
import { mountShaderfieldScene } from "./mount";

function mountAll() {
  const containers = document.querySelectorAll<HTMLElement>("[data-scene]");
  containers.forEach((container) => {
    if (container.dataset.shaderfieldMounted === "true") return;
    const raw = container.dataset.scene?.trim() ? container.dataset.scene : container.textContent;
    if (!raw) return;
    try {
      const scene = JSON.parse(raw) as Scene;
      container.textContent = "";
      mountShaderfieldScene(container, scene);
      container.dataset.shaderfieldMounted = "true";
    } catch (error) {
      console.error("[shaderfield] failed to mount scene", error);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountAll);
} else {
  mountAll();
}
