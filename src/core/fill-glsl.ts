import { GLProgram, setUniform, setUniformInt } from "./gl";
import { Fill } from "./scene-types";

export const MAX_GRADIENT_STOPS = 6;

/** Shared GLSL for evaluating a solid/linear/radial/mesh fill at local UV in [0,1]. Requires SIMPLEX_NOISE_GLSL. */
export const FILL_GLSL = `
uniform int u_fillType; // 0 = solid, 1 = gradient
uniform vec4 u_solidColor;
uniform int u_gradKind; // 0 = linear, 1 = radial, 2 = mesh
uniform float u_gradAngle;
uniform float u_stopOffsets[${MAX_GRADIENT_STOPS}];
uniform vec4 u_stopColors[${MAX_GRADIENT_STOPS}];
uniform int u_stopCount;
uniform vec4 u_meshCorners[4];
uniform float u_meshWarp;

vec4 sampleGradientStops(float t) {
  t = clamp(t, 0.0, 1.0);
  if (u_stopCount <= 1) return u_stopColors[0];
  for (int i = 0; i < ${MAX_GRADIENT_STOPS} - 1; i++) {
    if (i >= u_stopCount - 1) break;
    float a = u_stopOffsets[i];
    float b = u_stopOffsets[i + 1];
    if (t <= b || i == u_stopCount - 2) {
      float localT = b > a ? clamp((t - a) / (b - a), 0.0, 1.0) : 0.0;
      return mix(u_stopColors[i], u_stopColors[i + 1], localT);
    }
  }
  return u_stopColors[u_stopCount - 1];
}

vec4 evalFill(vec2 uv) {
  if (u_fillType == 0) return u_solidColor;

  if (u_gradKind == 0) {
    float rad = radians(u_gradAngle);
    vec2 dir = vec2(cos(rad), sin(rad));
    vec2 centered = uv - 0.5;
    float t = dot(centered, dir) + 0.5;
    return sampleGradientStops(t);
  }

  if (u_gradKind == 1) {
    float t = distance(uv, vec2(0.5)) * 2.0;
    return sampleGradientStops(t);
  }

  vec2 warpedUv = uv;
  if (u_meshWarp > 0.0) {
    float n = snoise(uv * 3.0) * u_meshWarp * 0.25;
    warpedUv = clamp(uv + n, 0.0, 1.0);
  }
  vec4 top = mix(u_meshCorners[0], u_meshCorners[1], warpedUv.x);
  vec4 bottom = mix(u_meshCorners[2], u_meshCorners[3], warpedUv.x);
  return mix(top, bottom, warpedUv.y);
}
`;

export function setFillUniforms(gl: WebGL2RenderingContext, program: GLProgram, fill: Fill): void {
  if (fill.type === "solid") {
    setUniformInt(gl, program, "u_fillType", 0);
    setUniform(gl, program, "u_solidColor", hexToRgbaArray(fill.color));
    return;
  }

  setUniformInt(gl, program, "u_fillType", 1);
  const gradient = fill.gradient;
  const kind = gradient.kind === "linear" ? 0 : gradient.kind === "radial" ? 1 : 2;
  setUniformInt(gl, program, "u_gradKind", kind);
  setUniform(gl, program, "u_gradAngle", gradient.angleDeg);
  setUniform(gl, program, "u_meshWarp", gradient.meshWarp ?? 0);

  if (gradient.kind === "mesh") {
    const meshCorners = gradient.meshCorners ?? ["#ff7a33ff", "#ff8f52ff", "#1a0f08ff", "#0b0b0cff"];
    const corners = meshCorners.flatMap((c) => hexToRgbaArray(c));
    const location = program.uniforms.get("u_meshCorners");
    if (location) gl.uniform4fv(location, new Float32Array(corners));
  }

  const stops = gradient.stops.slice(0, MAX_GRADIENT_STOPS);
  setUniformInt(gl, program, "u_stopCount", stops.length);
  const offsets = new Float32Array(MAX_GRADIENT_STOPS);
  const colors = new Float32Array(MAX_GRADIENT_STOPS * 4);
  stops.forEach((stop, i) => {
    offsets[i] = stop.offset;
    const rgba = hexToRgbaArray(stop.color);
    colors.set(rgba, i * 4);
  });
  const offsetsLocation = program.uniforms.get("u_stopOffsets");
  if (offsetsLocation) gl.uniform1fv(offsetsLocation, offsets);
  const colorsLocation = program.uniforms.get("u_stopColors");
  if (colorsLocation) gl.uniform4fv(colorsLocation, colors);
}

export function hexToRgbaArray(hex: string): [number, number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2) || "00", 16) / 255;
  const g = parseInt(clean.slice(2, 4) || "00", 16) / 255;
  const b = parseInt(clean.slice(4, 6) || "00", 16) / 255;
  const a = clean.length >= 8 ? parseInt(clean.slice(6, 8), 16) / 255 : 1;
  return [r, g, b, a];
}

export function rgbaArrayToHex([r, g, b, a]: [number, number, number, number]): string {
  const toHex = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
}
