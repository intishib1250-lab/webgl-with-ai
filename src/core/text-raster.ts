import { Fill } from "./scene-types";

export interface TextRasterOptions {
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

const RASTER_SCALE = 2; // supersample for crisper text before GPU minification

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, letterSpacing: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(" ");
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      const width = measureWithSpacing(ctx, candidate, letterSpacing);
      if (width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    lines.push(current);
  }
  return lines;
}

function measureWithSpacing(ctx: CanvasRenderingContext2D, text: string, letterSpacing: number): number {
  const base = ctx.measureText(text).width;
  return base + Math.max(0, text.length - 1) * letterSpacing;
}

function drawSpacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, letterSpacing: number, align: TextRasterOptions["align"]): void {
  const totalWidth = measureWithSpacing(ctx, text, letterSpacing);
  let cursor = x;
  if (align === "center") cursor = x - totalWidth / 2;
  else if (align === "right") cursor = x - totalWidth;

  const originalAlign = ctx.textAlign;
  ctx.textAlign = "left";
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + letterSpacing;
  }
  ctx.textAlign = originalAlign;
}

function buildFillStyle(ctx: CanvasRenderingContext2D, fill: Fill, width: number, height: number): string | CanvasGradient {
  if (fill.type === "solid") return fill.color;

  const gradient = fill.gradient;
  if (gradient.kind === "radial") {
    const g = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
    gradient.stops.forEach((stop) => g.addColorStop(stop.offset, stop.color));
    return g;
  }

  const rad = (gradient.angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const cx = width / 2;
  const cy = height / 2;
  const len = Math.abs(dx) * width + Math.abs(dy) * height;
  const g = ctx.createLinearGradient(cx - (dx * len) / 2, cy - (dy * len) / 2, cx + (dx * len) / 2, cy + (dy * len) / 2);
  gradient.stops.forEach((stop) => g.addColorStop(stop.offset, stop.color));
  return g;
}

export function rasterizeText(options: TextRasterOptions): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const width = Math.max(1, Math.round(options.width * RASTER_SCALE));
  const height = Math.max(1, Math.round(options.height * RASTER_SCALE));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const fontSize = options.fontSize * RASTER_SCALE;
  ctx.font = `${options.fontWeight} ${fontSize}px "${options.fontFamily}", sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = buildFillStyle(ctx, options.fill, width, height);

  const letterSpacing = options.letterSpacing * RASTER_SCALE;
  const lineHeightPx = fontSize * options.lineHeight;
  const lines = wrapLines(ctx, options.content, width, letterSpacing);
  const totalHeight = lines.length * lineHeightPx;
  const startY = height / 2 - totalHeight / 2 + lineHeightPx * 0.8;

  const x = options.align === "left" ? 0 : options.align === "right" ? width : width / 2;

  lines.forEach((line, i) => {
    drawSpacedText(ctx, line, x, startY + i * lineHeightPx, letterSpacing, options.align);
  });

  return canvas;
}
