import { BlendMode } from "@/core/scene-types";

export const BLEND_MODE_OPTIONS: { value: BlendMode; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "add", label: "Add" },
  { value: "subtract", label: "Subtract" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
  { value: "colorDodge", label: "Color dodge" },
  { value: "colorBurn", label: "Color burn" },
  { value: "linearBurn", label: "Linear burn" },
  { value: "hardLight", label: "Hard light" },
  { value: "softLight", label: "Soft light" },
  { value: "difference", label: "Difference" },
  { value: "exclusion", label: "Exclusion" },
  { value: "linearLight", label: "Linear light" },
  { value: "pinLight", label: "Pin light" },
  { value: "vividLight", label: "Vivid light" },
];
