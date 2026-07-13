import { SIMPLEX_NOISE_GLSL } from "../core/shaders";

/** Uniforms available to every effect pass. */
export const EFFECT_COMMON_UNIFORMS = `
uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_mouseVelocity;
`;

export const HASH_GLSL = `
float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float luminance(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
`;

/**
 * Wraps an effect body into a full GLSL ES 3.00 fragment shader. `body` reads
 * `uv` and `u_input` and must assign `fragColor`.
 */
export function buildEffectShader(extraUniforms: string, body: string, extraFunctions = ""): string {
  return `#version 300 es
precision highp float;
${EFFECT_COMMON_UNIFORMS}
${extraUniforms}
in vec2 v_uv;
out vec4 fragColor;
${SIMPLEX_NOISE_GLSL}
${HASH_GLSL}
${extraFunctions}
void main() {
  vec2 uv = v_uv;
  ${body}
}
`;
}
