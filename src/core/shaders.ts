import { FILL_GLSL } from "./fill-glsl";

/** Ashima Arts simplex noise (2D), MIT licensed, used by mesh gradients and shader effects. */
export const SIMPLEX_NOISE_GLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

export const CONTENT_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_uv;
uniform mat3 u_model;
uniform mat3 u_projection;
out vec2 v_uv;
void main() {
  vec3 pos = u_projection * (u_model * vec3(a_position, 1.0));
  v_uv = a_uv;
  gl_Position = vec4(pos.xy, 0.0, 1.0);
}
`;

export const IMAGE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_texture;
in vec2 v_uv;
out vec4 fragColor;
void main() {
  fragColor = texture(u_texture, v_uv);
}
`;

export const FULLSCREEN_FILL_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const SHAPE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec2 u_size;
uniform float u_cornerRadius;
uniform int u_shapeKind; // 0 rectangle, 1 ellipse, 2 plane, 3 polygon
uniform float u_sides;
${SIMPLEX_NOISE_GLSL}
${FILL_GLSL}
in vec2 v_uv;
out vec4 fragColor;

float sdRoundRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float sdEllipse(vec2 p, vec2 radii) {
  return (length(p / radii) - 1.0) * min(radii.x, radii.y);
}

float sdPolygon(vec2 p, float radius, float sides) {
  float angle = atan(p.x, p.y);
  float segment = 6.28318530718 / sides;
  float a = mod(angle, segment) - segment * 0.5;
  return length(p) * cos(a) - radius * cos(segment * 0.5);
}

void main() {
  vec2 p = (v_uv - 0.5) * u_size;
  float aa = fwidth(length(p)) + 0.75;
  float d;
  if (u_shapeKind == 1) {
    d = sdEllipse(p, u_size * 0.5);
  } else if (u_shapeKind == 2) {
    d = -1.0;
  } else if (u_shapeKind == 3) {
    d = sdPolygon(p, min(u_size.x, u_size.y) * 0.5, max(3.0, u_sides));
  } else {
    d = sdRoundRect(p, u_size * 0.5, u_cornerRadius);
  }
  float coverage = 1.0 - smoothstep(0.0, aa, d);
  vec4 color = evalFill(v_uv);
  color.a *= coverage;
  fragColor = color;
}
`;

export const GRADIENT_FRAGMENT_SHADER = `#version 300 es
precision highp float;
${SIMPLEX_NOISE_GLSL}
${FILL_GLSL}
in vec2 v_uv;
out vec4 fragColor;
void main() {
  fragColor = evalFill(v_uv);
}
`;

export const BACKGROUND_FRAGMENT_SHADER = GRADIENT_FRAGMENT_SHADER;

/**
 * Standard Photoshop/CSS-compositing separable blend modes, evaluated on
 * straight (non-premultiplied) [0,1] color. Index order matches
 * BLEND_MODE_INDEX in renderer.ts and the BlendMode union in scene-types.ts.
 */
export const BLEND_MODE_GLSL = `
float hardLightChannel(float cb, float cs) {
  return cs <= 0.5 ? 2.0 * cb * cs : 1.0 - 2.0 * (1.0 - cb) * (1.0 - cs);
}
vec3 blendHardLight(vec3 cb, vec3 cs) {
  return vec3(hardLightChannel(cb.r, cs.r), hardLightChannel(cb.g, cs.g), hardLightChannel(cb.b, cs.b));
}
float colorDodgeChannel(float cb, float cs) {
  if (cb <= 0.0) return 0.0;
  if (cs >= 1.0) return 1.0;
  return min(1.0, cb / (1.0 - cs));
}
vec3 blendColorDodge(vec3 cb, vec3 cs) {
  return vec3(colorDodgeChannel(cb.r, cs.r), colorDodgeChannel(cb.g, cs.g), colorDodgeChannel(cb.b, cs.b));
}
float colorBurnChannel(float cb, float cs) {
  if (cb >= 1.0) return 1.0;
  if (cs <= 0.0) return 0.0;
  return 1.0 - min(1.0, (1.0 - cb) / cs);
}
vec3 blendColorBurn(vec3 cb, vec3 cs) {
  return vec3(colorBurnChannel(cb.r, cs.r), colorBurnChannel(cb.g, cs.g), colorBurnChannel(cb.b, cs.b));
}
float softLightChannel(float cb, float cs) {
  float d = cb <= 0.25 ? ((16.0 * cb - 12.0) * cb + 4.0) * cb : sqrt(cb);
  return cs <= 0.5 ? cb - (1.0 - 2.0 * cs) * cb * (1.0 - cb) : cb + (2.0 * cs - 1.0) * (d - cb);
}
vec3 blendSoftLight(vec3 cb, vec3 cs) {
  return vec3(softLightChannel(cb.r, cs.r), softLightChannel(cb.g, cs.g), softLightChannel(cb.b, cs.b));
}
float pinLightChannel(float cb, float cs) {
  return cs <= 0.5 ? min(cb, 2.0 * cs) : max(cb, 2.0 * cs - 1.0);
}
vec3 blendPinLight(vec3 cb, vec3 cs) {
  return vec3(pinLightChannel(cb.r, cs.r), pinLightChannel(cb.g, cs.g), pinLightChannel(cb.b, cs.b));
}
float vividLightChannel(float cb, float cs) {
  return cs <= 0.5 ? colorBurnChannel(cb, 2.0 * cs) : colorDodgeChannel(cb, 2.0 * cs - 1.0);
}
vec3 blendVividLight(vec3 cb, vec3 cs) {
  return vec3(vividLightChannel(cb.r, cs.r), vividLightChannel(cb.g, cs.g), vividLightChannel(cb.b, cs.b));
}

vec3 applyBlendMode(vec3 cb, vec3 cs, int mode) {
  if (mode == 1) return cb + cs;                                          // add
  if (mode == 2) return max(cb - cs, 0.0);                                 // subtract
  if (mode == 3) return cb * cs;                                           // multiply
  if (mode == 4) return cb + cs - cb * cs;                                 // screen
  if (mode == 5) return blendHardLight(cs, cb);                            // overlay = hard light(cs, cb)
  if (mode == 6) return min(cb, cs);                                       // darken
  if (mode == 7) return max(cb, cs);                                       // lighten
  if (mode == 8) return blendColorDodge(cb, cs);                           // color dodge
  if (mode == 9) return blendColorBurn(cb, cs);                            // color burn
  if (mode == 10) return max(cb + cs - 1.0, 0.0);                          // linear burn
  if (mode == 11) return blendHardLight(cb, cs);                           // hard light
  if (mode == 12) return blendSoftLight(cb, cs);                           // soft light
  if (mode == 13) return abs(cb - cs);                                     // difference
  if (mode == 14) return cb + cs - 2.0 * cb * cs;                          // exclusion
  if (mode == 15) return clamp(cb + 2.0 * cs - 1.0, 0.0, 1.0);             // linear light
  if (mode == 16) return blendPinLight(cb, cs);                            // pin light
  if (mode == 17) return blendVividLight(cb, cs);                          // vivid light
  return cs;                                                               // normal
}
`;

/**
 * Composites src over dst using straight (non-premultiplied) alpha per the W3C
 * compositing/blending formula, so partially-transparent backdrops (stacked
 * layers, excluded scene background) combine correctly instead of fringing.
 */
export const COMPOSITE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_dst;
uniform sampler2D u_src;
uniform int u_mode;
uniform float u_opacity;
${BLEND_MODE_GLSL}
in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 dst = texture(u_dst, v_uv);
  vec4 src = texture(u_src, v_uv);
  float as = src.a * u_opacity;
  float ab = dst.a;
  vec3 blended = applyBlendMode(dst.rgb, src.rgb, u_mode);
  vec3 co = as * (1.0 - ab) * src.rgb + as * ab * blended + (1.0 - as) * ab * dst.rgb;
  float ao = as + ab * (1.0 - as);
  fragColor = ao > 0.0001 ? vec4(co / ao, ao) : vec4(0.0);
}
`;

export const COPY_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_input;
in vec2 v_uv;
out vec4 fragColor;
void main() {
  fragColor = texture(u_input, v_uv);
}
`;

/** Straight-alpha over the canvas backing (used for the final blit + PNG/embed backgrounds). */
export const BLIT_FRAGMENT_SHADER = COPY_FRAGMENT_SHADER;
