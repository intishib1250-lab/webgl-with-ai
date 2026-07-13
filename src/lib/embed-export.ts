import { Scene } from "@/core/scene-types";
import { sanitizeFilename } from "@/state/persistence";

/**
 * Downloads a single self-contained HTML file that demonstrates (and IS) the
 * embed pattern: a `<div data-scene>` holding the scene JSON plus one
 * `<script>` tag running the standalone runtime built from src/embed/. Both
 * pieces can be copy-pasted as-is into any other page.
 */
export async function downloadEmbedBundle(scene: Scene): Promise<void> {
  const runtimeResponse = await fetch(`${import.meta.env.BASE_URL}embed/shaderfield-embed.js`);
  if (!runtimeResponse.ok) {
    throw new Error("Embed runtime not built. Run `npm run build:embed` and reload.");
  }
  const runtimeSource = await runtimeResponse.text();
  const sceneJson = JSON.stringify(scene);

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(scene.name)}</title>
<style>
  html, body { margin: 0; height: 100%; background: ${solidBackgroundOrFallback(scene)}; }
  [data-scene] { width: 100%; height: 100%; }
</style>
</head>
<body>
<!-- Drop this div + the script below into any page to embed this scene. -->
<div data-scene>${sceneJson.replace(/</g, "\\u003c")}</div>
<script>
${runtimeSource}
</script>
</body>
</html>
`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(scene.name)}-embed.html`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

function solidBackgroundOrFallback(scene: Scene): string {
  const fill = scene.background.fill;
  return fill.type === "solid" ? fill.color : "#0b0b0c";
}
