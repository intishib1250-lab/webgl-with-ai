export interface CuratedFont {
  family: string;
  weights: number[];
}

export const CURATED_FONTS: CuratedFont[] = [
  { family: "Inter", weights: [400, 500, 600, 700, 800] },
  { family: "Manrope", weights: [400, 500, 700, 800] },
  { family: "Space Grotesk", weights: [400, 500, 700] },
  { family: "Sora", weights: [400, 600, 800] },
  { family: "Archivo", weights: [400, 600, 800] },
  { family: "Bricolage Grotesque", weights: [400, 600, 800] },
  { family: "Instrument Serif", weights: [400] },
  { family: "Playfair Display", weights: [400, 600, 800] },
  { family: "DM Serif Display", weights: [400] },
  { family: "Fraunces", weights: [400, 600, 800] },
  { family: "JetBrains Mono", weights: [400, 600, 800] },
  { family: "Space Mono", weights: [400, 700] },
  { family: "Bebas Neue", weights: [400] },
  { family: "Unbounded", weights: [400, 700, 900] },
  { family: "Big Shoulders Display", weights: [400, 700, 900] },
];

const loadedFamilies = new Set<string>();

export function ensureFontLoaded(family: string): void {
  if (loadedFamilies.has(family)) return;
  const font = CURATED_FONTS.find((f) => f.family === family);
  if (!font) return;
  loadedFamilies.add(family);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  const weights = font.weights.join(";");
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weights}&display=swap`;
  document.head.appendChild(link);
}

export function loadAllCuratedFonts(): void {
  for (const font of CURATED_FONTS) ensureFontLoaded(font.family);
}
