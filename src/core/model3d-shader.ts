/**
 * Raymarched SDF primitives for the 3D model layer. Reuses CONTENT_VERTEX_SHADER
 * (see shaders.ts) — v_uv comes from the layer's own on-canvas quad, and this
 * fragment shader treats that quad as a camera viewport into a small 3D scene
 * centered at the origin, independent of the quad's 2D placement/rotation.
 *
 * gl_FragCoord is in full-canvas pixel space (this pass renders into a
 * canvas-sized target, same as every other content layer), so it doubles as
 * the screen-space UV used to sample the scene composited so far, for
 * refraction/reflection.
 */
export const MODEL3D_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float u_aspect; // width / height of the layer's on-canvas quad
uniform float u_fov;
uniform vec2 u_canvasResolution;
uniform sampler2D u_sceneTexture; // everything composited beneath this layer so far

uniform vec3 u_rotationDeg; // object pitch/yaw/roll, degrees ("Axis")
uniform float u_time;
uniform vec3 u_animDirection; // per-axis rotation speed multipliers
uniform float u_animSpeed;

uniform vec2 u_interactiveOffset; // renderer-smoothed (momentum/spring) cursor offset, radians
uniform float u_trackMouseAmount;
uniform int u_mouseAxes; // 0 = x, 1 = y, 2 = both
uniform float u_axisTilt;

uniform int u_primitive;
uniform float u_scale3d;
uniform vec2 u_twist;
uniform float u_rounding;
uniform float u_variation;
uniform float u_smoothing;
uniform float u_extrude;
uniform float u_mix;

uniform bool u_hasCustomMap;
uniform sampler2D u_customMap;

uniform int u_repeatType; // 0 none, 1 xy, 2 x, 3 y, 4 xyz, 5 radial, 6 radial2
uniform float u_repeatSpacing;

uniform bool u_showBackground;
uniform vec3 u_backgroundColor;

uniform float u_refractAmount;
uniform int u_refractBehavior; // 0 refract, 1 reflect
uniform float u_dispersion;
uniform float u_refractRoughness;

uniform int u_surfaceTextureType; // 0 none, 1 image, 2 striped, 3 wavy, 4 beaded, 5 diamond, 6 linoleum
uniform float u_surfaceTextureAmount;
uniform float u_surfaceTextureScale;
uniform bool u_hasTexture;
uniform sampler2D u_texture;

uniform vec3 u_materialColor;
uniform float u_roughness;
uniform float u_metalness;

uniform vec3 u_lightPosition;
uniform float u_specular;
uniform float u_fresnel;
uniform vec3 u_lightColor;
uniform float u_opaqueness;

in vec2 v_uv;
out vec4 fragColor;

mat3 rotateX(float a) { float c = cos(a), s = sin(a); return mat3(1.0,0.0,0.0, 0.0,c,-s, 0.0,s,c); }
mat3 rotateY(float a) { float c = cos(a), s = sin(a); return mat3(c,0.0,s, 0.0,1.0,0.0, -s,0.0,c); }
mat3 rotateZ(float a) { float c = cos(a), s = sin(a); return mat3(c,-s,0.0, s,c,0.0, 0.0,0.0,1.0); }

float hash13(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i + vec3(0, 0, 0)), hash13(i + vec3(1, 0, 0)), f.x),
        mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x),
        mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y),
    f.z
  );
}

float smin(float a, float b, float k) {
  if (k <= 0.0001) return min(a, b);
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// --- primitives (local unit space, roughly radius 0.6-0.9) ---

float sdSphere(vec3 p, float r) { return length(p) - r; }

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float sdCylinder(vec3 p, float h, float r) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdOctahedron(vec3 p, float s) {
  p = abs(p);
  float m = p.x + p.y + p.z - s;
  vec3 q;
  if (3.0 * p.x < m) q = p.xyz;
  else if (3.0 * p.y < m) q = p.yzx;
  else if (3.0 * p.z < m) q = p.zxy;
  else return m * 0.57735027;
  float k = clamp(0.5 * (q.z - q.y + s), 0.0, s);
  return length(vec3(q.x, q.y - s + k, q.z - k));
}

float sdCross(vec3 p, float extent, float b) {
  float da = sdBox(p, vec3(extent, b, b));
  float db = sdBox(p, vec3(b, extent, b));
  float dc = sdBox(p, vec3(b, b, extent));
  // Smooth (not hard) union: a hard min() lets Rounding's global inflate/erode each thin arm
  // independently, splitting them apart once the radius exceeds the arm's own half-thickness.
  float k = b * 0.4;
  return smin(smin(da, db, k), dc, k);
}

float sdHexPrism(vec3 p, vec2 h) {
  const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
  p = abs(p);
  p.xy -= 2.0 * min(dot(k.xy, p.xy), 0.0) * k.xy;
  vec2 d = vec2(
    length(p.xy - vec2(clamp(p.x, -k.z * h.x, k.z * h.x), h.x)) * sign(p.y - h.x),
    p.z - h.y
  );
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdTriPrism(vec3 p, vec2 h) {
  const float k = 1.7320508;
  h.x *= 0.5 * k;
  p.xy /= h.x;
  p.x = abs(p.x) - 1.0;
  p.y = p.y + 1.0 / k;
  if (p.x + k * p.y > 0.0) p.xy = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0, 0.0);
  float d1 = length(p.xy) * sign(-p.y) * h.x;
  float d2 = abs(p.z) - h.y;
  return length(max(vec2(d1, d2), 0.0)) + min(max(d1, d2), 0.0);
}

float sdConeSection(vec3 p, vec2 c, float h) {
  vec2 q = h * vec2(c.x / c.y, -1.0);
  vec2 w = vec2(length(p.xz), p.y);
  vec2 a = w - q * clamp(dot(w, q) / dot(q, q), 0.0, 1.0);
  vec2 b = w - q * vec2(clamp(w.x / q.x, 0.0, 1.0), 1.0);
  float k = sign(q.y);
  float d = min(dot(a, a), dot(b, b));
  float s = max(k * (w.x * q.y - w.y * q.x), k * (w.y - q.y));
  return sqrt(d) * sign(s);
}

float sdStar5(vec2 p, float r, float rf) {
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-0.809016994375, -0.587785252292);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0, 1);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}

float sdPyramid(vec3 p, float h) {
  float m2 = h * h + 0.25;
  p.xz = abs(p.xz);
  p.xz = (p.z > p.x) ? p.zx : p.xz;
  p.xz -= 0.5;
  vec3 q = vec3(p.z, h * p.y - 0.5 * p.x, h * p.x + 0.5 * p.y);
  float s = max(-q.x, 0.0);
  float t = clamp((q.y - 0.5 * p.z) / (m2 + 0.25), 0.0, 1.0);
  float a = m2 * (q.x + s) * (q.x + s) + q.y * q.y;
  float b = m2 * (q.x + 0.5 * t) * (q.x + 0.5 * t) + (q.y - m2 * t) * (q.y - m2 * t);
  float d2 = min(q.y, -q.x * m2 - q.y * 0.5) > 0.0 ? 0.0 : min(a, b);
  return sqrt((d2 + q.z * q.z) / m2) * sign(max(q.z, -p.y));
}

float sdDodecahedron(vec3 p, float r) {
  const float phi = 1.61803398875;
  float d = 0.0;
  d = max(d, abs(dot(p, normalize(vec3(0.0, 1.0, phi)))));
  d = max(d, abs(dot(p, normalize(vec3(0.0, -1.0, phi)))));
  d = max(d, abs(dot(p, normalize(vec3(0.0, 1.0, -phi)))));
  d = max(d, abs(dot(p, normalize(vec3(0.0, -1.0, -phi)))));
  d = max(d, abs(dot(p, normalize(vec3(1.0, phi, 0.0)))));
  d = max(d, abs(dot(p, normalize(vec3(-1.0, phi, 0.0)))));
  d = max(d, abs(dot(p, normalize(vec3(1.0, -phi, 0.0)))));
  d = max(d, abs(dot(p, normalize(vec3(-1.0, -phi, 0.0)))));
  d = max(d, abs(dot(p, normalize(vec3(phi, 0.0, 1.0)))));
  d = max(d, abs(dot(p, normalize(vec3(-phi, 0.0, 1.0)))));
  d = max(d, abs(dot(p, normalize(vec3(phi, 0.0, -1.0)))));
  d = max(d, abs(dot(p, normalize(vec3(-phi, 0.0, -1.0)))));
  return d - r;
}

float sdBoxFrame(vec3 p, vec3 b, float e) {
  p = abs(p) - b;
  vec3 q = abs(p + e) - e;
  return min(min(
    length(max(vec3(p.x, q.y, q.z), 0.0)) + min(max(p.x, max(q.y, q.z)), 0.0),
    length(max(vec3(q.x, p.y, q.z), 0.0)) + min(max(q.x, max(p.y, q.z)), 0.0)),
    length(max(vec3(q.x, q.y, p.z), 0.0)) + min(max(q.x, max(q.y, p.z)), 0.0));
}

float sdCylinderAxisX(vec3 p, float h, float r) { return sdCylinder(p.yxz, h, r); }
float sdCylinderAxisZ(vec3 p, float h, float r) { return sdCylinder(p.xzy, h, r); }

float sdSpring(vec3 p) {
  float ang = atan(p.z, p.x);
  float turnHeight = 0.34;
  float y = p.y - ang * (turnHeight / 6.28318530718) * 3.0;
  float wrapped = mod(y + turnHeight * 0.5, turnHeight) - turnHeight * 0.5;
  vec2 q = vec2(length(p.xz) - 0.55, wrapped);
  return length(q) - 0.16;
}

float sdTricylinder(vec3 p) {
  float cx = sdCylinderAxisX(p, 0.72, 0.24);
  float cy = sdCylinder(p, 0.72, 0.24);
  float cz = sdCylinderAxisZ(p, 0.72, 0.24);
  // Smooth union so global Rounding inflates a single connected blob rather than eroding each
  // thin cylinder arm apart once the radius exceeds its own thickness.
  return smin(smin(cx, cy, 0.1), cz, 0.1);
}

float sdMergedDiscs(vec3 p) {
  float d1 = sdCylinder(p - vec3(0.22, 0.08, 0.0), 0.06, 0.55);
  float d2 = sdCylinder(p - vec3(-0.2, -0.05, 0.12), 0.06, 0.48);
  float d3 = sdCylinder(p - vec3(0.02, -0.02, -0.2), 0.06, 0.42);
  return smin(smin(d1, d2, 0.12), d3, 0.12);
}

float sdRippledSphere(vec3 p) {
  float r = length(p);
  float ripple = sin(r * 22.0) * 0.035 + sin(atan(p.z, p.x) * 10.0 + p.y * 6.0) * 0.02;
  return r - 0.85 - ripple;
}

float sdTop(vec3 p) {
  float body = sdConeSection(p - vec3(0.0, 0.32, 0.0), normalize(vec2(0.55, 1.0)), 0.62);
  float tip = sdSphere(p - vec3(0.0, -0.52, 0.0), 0.1);
  return smin(body, tip, 0.05);
}

float sdStar(vec3 p) {
  float d2 = sdStar5(p.xy, 0.78, 0.42);
  float dz = abs(p.z) - 0.22;
  return length(max(vec2(d2, dz), 0.0)) + min(max(d2, dz), 0.0);
}

float sdAsterisk(vec3 p) {
  // Smooth union throughout: with a hard min(), global Rounding erodes each thin capsule arm
  // independently and they visually detach once the radius exceeds the arm's own thickness.
  float d = sdCross(p, 0.78, 0.13);
  d = smin(d, sdCapsule(p, vec3(-0.55, -0.55, 0.0), vec3(0.55, 0.55, 0.0), 0.12), 0.08);
  d = smin(d, sdCapsule(p, vec3(-0.55, 0.55, 0.0), vec3(0.55, -0.55, 0.0), 0.12), 0.08);
  d = smin(d, sdCapsule(p, vec3(0.0, -0.55, -0.55), vec3(0.0, 0.55, 0.55), 0.12), 0.08);
  d = smin(d, sdCapsule(p, vec3(0.0, -0.55, 0.55), vec3(0.0, 0.55, -0.55), 0.12), 0.08);
  return d;
}

float sdCustom(vec3 p) {
  vec2 footprint = vec2(0.75);
  if (!u_hasCustomMap) return sdRoundBox(p, vec3(0.7, 0.04, 0.7), 0.04);
  vec2 uv = p.xz / (footprint * 2.0) + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    vec2 q = abs(p.xz) - footprint;
    float outside = length(max(q, 0.0));
    return max(outside, abs(p.y) - 0.05);
  }
  float height = (texture(u_customMap, uv).r - 0.5) * u_extrude * 1.2;
  return p.y - height;
}

float evalPrimitive(vec3 p) {
  if (u_primitive == 1) return sdBox(p, vec3(0.7));
  if (u_primitive == 2) return sdSphere(p, 0.9);
  if (u_primitive == 3) return sdCapsule(p, vec3(0.0, -0.5, 0.0), vec3(0.0, 0.5, 0.0), 0.32);
  if (u_primitive == 4) return sdCylinder(p, 0.08, 0.85);
  if (u_primitive == 5) return sdCylinder(p, 0.55, 0.5);
  if (u_primitive == 6) return sdOctahedron(p, 0.9);
  if (u_primitive == 7) return sdHexPrism(p.xzy, vec2(0.58, 0.45));
  if (u_primitive == 8) return sdCross(p, 0.85, 0.26);
  if (u_primitive == 9) return sdSpring(p);
  if (u_primitive == 10) return sdTricylinder(p);
  if (u_primitive == 11) return sdTriPrism(p, vec2(1.05, 0.42));
  if (u_primitive == 12) return sdCross(p, 0.8, 0.22) - 0.08;
  if (u_primitive == 13) return sdRoundBox(p, vec3(0.62), 0.15);
  if (u_primitive == 14) return sdMergedDiscs(p);
  if (u_primitive == 15) return sdRippledSphere(p);
  if (u_primitive == 16) return sdTop(p);
  if (u_primitive == 17) return sdStar(p);
  if (u_primitive == 18) return sdPyramid(vec3(p.x, p.y + 0.35, p.z), 1.15);
  if (u_primitive == 19) return sdAsterisk(p);
  if (u_primitive == 20) return sdDodecahedron(p, 0.72);
  if (u_primitive == 21) return sdBoxFrame(p, vec3(0.62), 0.09);
  if (u_primitive == 22) return sdCustom(p);
  return sdTorus(p, vec2(0.62, 0.28)); // 0: torus
}

vec3 applyRepeat(vec3 p) {
  float s = max(u_repeatSpacing, 0.2);
  if (u_repeatType == 1) return vec3(mod(p.x + 0.5 * s, s) - 0.5 * s, p.y, mod(p.z + 0.5 * s, s) - 0.5 * s);
  if (u_repeatType == 2) return vec3(mod(p.x + 0.5 * s, s) - 0.5 * s, p.y, p.z);
  if (u_repeatType == 3) return vec3(p.x, mod(p.y + 0.5 * s, s) - 0.5 * s, p.z);
  if (u_repeatType == 4) return vec3(mod(p.x + 0.5 * s, s) - 0.5 * s, mod(p.y + 0.5 * s, s) - 0.5 * s, mod(p.z + 0.5 * s, s) - 0.5 * s);
  if (u_repeatType == 5) {
    float segAngle = 6.28318530718 / max(3.0, floor(10.0 / s));
    float a = atan(p.z, p.x);
    a = mod(a + 0.5 * segAngle, segAngle) - 0.5 * segAngle;
    float r = length(p.xz);
    return vec3(r * cos(a), p.y, r * sin(a));
  }
  if (u_repeatType == 6) {
    float segAngle = 6.28318530718 / max(3.0, floor(10.0 / s));
    float a = atan(p.y, p.x);
    a = mod(a + 0.5 * segAngle, segAngle) - 0.5 * segAngle;
    float r = length(p.xy);
    return vec3(r * cos(a), r * sin(a), p.z);
  }
  return p;
}

float map(vec3 p) {
  p = applyRepeat(p);

  float m = clamp(u_mix, 0.0, 1.0);
  vec3 tp = p / max(u_scale3d, 0.05);

  // twist: rotate around Y by an amount proportional to height, plus a secondary X-axis twist
  float twistAmtY = u_twist.x * m * 3.0;
  float ang = tp.y * twistAmtY;
  float ca = cos(ang), sa = sin(ang);
  tp.xz = mat2(ca, -sa, sa, ca) * tp.xz;
  float twistAmtX = u_twist.y * m * 3.0;
  float angX = tp.x * twistAmtX;
  float cax = cos(angX), sax = sin(angX);
  tp.yz = mat2(cax, -sax, sax, cax) * tp.yz;

  // extrude: stretch along Z for ordinary primitives (custom primitive uses u_extrude for height instead)
  if (u_primitive != 22) tp.z /= mix(1.0, 1.0 + u_extrude * 1.5, m);

  // Rounding is subtracted in local (pre-scale) space so the fillet radius stays proportional
  // to the primitive's own size regardless of the Scale slider, instead of a fixed world-space amount.
  float d = evalPrimitive(tp) - u_rounding * m * 0.25;
  d *= max(u_scale3d, 0.05);

  if (u_variation > 0.0001) {
    d += (noise3(p * 6.0) - 0.5) * u_variation * m * 0.18;
  }

  return d;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

vec3 triplanarSample(vec3 p, vec3 n) {
  vec3 w = pow(abs(n), vec3(4.0));
  w /= (w.x + w.y + w.z + 0.0001);
  vec3 cx = texture(u_texture, p.yz * 0.6 + 0.5).rgb;
  vec3 cy = texture(u_texture, p.xz * 0.6 + 0.5).rgb;
  vec3 cz = texture(u_texture, p.xy * 0.6 + 0.5).rgb;
  return cx * w.x + cy * w.y + cz * w.z;
}

vec3 surfacePattern(vec3 p, vec3 n, vec3 baseColor) {
  if (u_surfaceTextureType == 1) {
    return u_hasTexture ? mix(baseColor, triplanarSample(p, n), u_surfaceTextureAmount) : baseColor;
  }
  float s = max(u_surfaceTextureScale, 0.05) * 6.0;
  float pattern = 0.5;
  if (u_surfaceTextureType == 2) pattern = sin(p.y * s) * 0.5 + 0.5;
  else if (u_surfaceTextureType == 3) pattern = sin(p.x * s + sin(p.y * s * 0.6) * 2.0) * 0.5 + 0.5;
  else if (u_surfaceTextureType == 4) {
    vec3 c = fract(p * s) - 0.5;
    pattern = 1.0 - smoothstep(0.15, 0.35, length(c));
  } else if (u_surfaceTextureType == 5) {
    vec3 c = abs(fract(p * s) - 0.5);
    pattern = step(c.x + c.y + c.z, 0.55) ;
  } else if (u_surfaceTextureType == 6) {
    pattern = noise3(p * s * 0.8) * 0.5 + noise3(p * s * 2.1 + 5.0) * 0.5;
  } else {
    return baseColor;
  }
  vec3 shaded = baseColor * (0.7 + 0.3 * pattern);
  return mix(baseColor, shaded, u_surfaceTextureAmount);
}

vec3 sampleScene(vec2 screenUv) {
  return texture(u_sceneTexture, clamp(screenUv, 0.0, 1.0)).rgb;
}

// --- lighting: Cook-Torrance PBR (GGX distribution, Smith-correlated visibility, Schlick fresnel,
// Oren-Nayar diffuse). Formulas adapted from LYGIA (https://lygia.xyz) by Patricio Gonzalez Vivo,
// used here under the Prosperity Public License 3.0.0 for personal/non-commercial use —
// https://github.com/patriciogonzalezvivo/lygia/blob/main/LICENSE.md

const float PI = 3.14159265359;
const float INV_PI = 0.3183098862;

float pow5(float v) { float v2 = v * v; return v2 * v2 * v; }

vec3 schlickFresnel(vec3 f0, float f90, float VoH) {
  return f0 + (vec3(f90) - f0) * pow5(1.0 - VoH);
}

// Walter et al. 2007, "Microfacet Models for Refraction through Rough Surfaces"
float ggxDistribution(float NoH, float roughness) {
  float oneMinusNoHSquared = 1.0 - NoH * NoH;
  float a = NoH * roughness;
  float k = roughness / (oneMinusNoHSquared + a * a + 1e-7);
  return min(k * k * INV_PI, 65504.0);
}

// Heitz 2014, "Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs"
float smithGGXCorrelated(float NoV, float NoL, float roughness) {
  float a2 = roughness * roughness;
  float lambdaV = NoL * sqrt((NoV - a2 * NoV) * NoV + a2);
  float lambdaL = NoV * sqrt((NoL - a2 * NoL) * NoL + a2);
  return min(0.5 / max(lambdaV + lambdaL, 1e-7), 65504.0);
}

// Oren & Nayar 1994 — rougher-surface-aware diffuse (falls back to Lambert-like as roughness -> 0)
float diffuseOrenNayar(vec3 L, vec3 N, vec3 V, float NoV, float NoL, float roughness) {
  float LoV = dot(L, V);
  float s = LoV - NoL * NoV;
  float t = mix(1.0, max(NoL, NoV), step(0.0, s));
  float sigma2 = roughness * roughness;
  float A = 1.0 + sigma2 * (1.0 / (sigma2 + 0.13) + 0.5 / (sigma2 + 0.33));
  float B = 0.45 * sigma2 / (sigma2 + 0.09);
  return max(0.0, NoL) * (A + B * s / max(t, 1e-4));
}

void main() {
  vec2 uv = (v_uv - 0.5) * 2.0;
  uv.x *= u_aspect;

  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(uv * tan(radians(u_fov) * 0.5), -1.0));

  float mouseX = (u_mouseAxes == 1) ? 0.0 : u_interactiveOffset.x; // 1 = y-only
  float mouseY = (u_mouseAxes == 0) ? 0.0 : u_interactiveOffset.y; // 0 = x-only

  float yaw = radians(u_rotationDeg.y) + u_time * u_animSpeed * u_animDirection.y * 0.35 + mouseX * u_trackMouseAmount;
  float pitch = radians(u_rotationDeg.x) + u_time * u_animSpeed * u_animDirection.x * 0.35 - mouseY * u_trackMouseAmount;
  float roll = radians(u_rotationDeg.z) + u_time * u_animSpeed * u_animDirection.z * 0.35 + (mouseX + mouseY) * u_axisTilt * u_trackMouseAmount * 0.5;

  mat3 objectRotation = rotateY(yaw) * rotateX(pitch) * rotateZ(roll);
  mat3 inverseRotation = transpose(objectRotation);
  ro = inverseRotation * ro;
  rd = inverseRotation * rd;

  float t = 0.0;
  bool hit = false;
  for (int i = 0; i < 90; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);
    if (d < 0.0015) { hit = true; break; }
    t += d;
    if (t > 8.0) break;
  }

  vec2 screenUv = gl_FragCoord.xy / u_canvasResolution;

  if (!hit) {
    if (u_showBackground) {
      fragColor = vec4(u_backgroundColor, 1.0);
    } else {
      fragColor = vec4(0.0);
    }
    return;
  }

  vec3 p = ro + rd * t;
  vec3 n = calcNormal(p);

  // The camera looks down -Z, so a positive Light Position Z (matching the reference tool's
  // "toward the viewer" convention) needs to be flipped here to mean "on the camera's side."
  vec3 lightPosObj = inverseRotation * vec3(u_lightPosition.x, u_lightPosition.y, -u_lightPosition.z);
  vec3 lightDir = normalize(lightPosObj - p);
  vec3 viewDir = normalize(-rd);
  vec3 halfDir = normalize(lightDir + viewDir);

  float NoV = max(dot(n, viewDir), 1e-4);
  float NoL = max(dot(n, lightDir), 0.0);
  float NoH = max(dot(n, halfDir), 0.0);
  float VoH = max(dot(viewDir, halfDir), 0.0);
  float linearRoughness = clamp(u_roughness, 0.045, 1.0);

  vec3 baseColor = surfacePattern(p, n, u_materialColor);
  vec3 f0 = mix(vec3(0.04), baseColor, u_metalness);

  float D = ggxDistribution(NoH, linearRoughness);
  float Vis = smithGGXCorrelated(NoV, NoL, linearRoughness);
  vec3 F = schlickFresnel(f0, 1.0, VoH);
  vec3 spec = D * Vis * F;

  float diff = diffuseOrenNayar(lightDir, n, viewDir, NoV, NoL, linearRoughness) * INV_PI;
  vec3 kd = (1.0 - u_metalness) * (vec3(1.0) - F);

  // LIGHT_INTENSITY compensates for the lack of an exposure/intensity control in the UI — a single
  // unit-color point light is too dim once diffuse is properly energy-normalized (divided by PI).
  const float LIGHT_INTENSITY = 3.6;
  vec3 direct = (kd * baseColor * diff + spec * u_specular * 2.0) * u_lightColor * NoL * LIGHT_INTENSITY;
  // no IBL, so a small flat ambient keeps shadowed faces from crushing to pure black
  vec3 ambient = baseColor * mix(0.16, 0.05, u_metalness);
  // artistic rim-light boost, layered on top of the physically-correct fresnel already in the BRDF
  float rim = pow(1.0 - NoV, 3.0) * u_fresnel;

  vec3 color = direct + ambient + rim * u_lightColor;

  if (u_refractAmount > 0.0001) {
    // Reflect: mirror the view ray off the surface. Refract: bend it through the surface (Snell's law,
    // eta ~= air-into-glass); total-internal-reflection falls back to a mirror bounce.
    vec3 bentDir;
    if (u_refractBehavior == 1) {
      bentDir = reflect(rd, n);
    } else {
      bentDir = refract(rd, n, 0.75);
      if (dot(bentDir, bentDir) < 0.0001) bentDir = reflect(rd, n);
    }
    vec3 bentWorld = objectRotation * bentDir;
    vec2 offsetDir = bentWorld.xy * u_refractAmount * 0.35;
    vec3 envColor;
    if (u_dispersion > 0.0001) {
      envColor = vec3(
        sampleScene(screenUv + offsetDir * (1.0 + u_dispersion)).r,
        sampleScene(screenUv + offsetDir).g,
        sampleScene(screenUv + offsetDir * (1.0 - u_dispersion)).b
      );
    } else {
      envColor = sampleScene(screenUv + offsetDir);
    }
    if (u_refractRoughness > 0.0001) {
      vec3 blurred = envColor;
      float total = 1.0;
      for (int i = 0; i < 4; i++) {
        float a = float(i) * 1.5708;
        vec2 jitter = vec2(cos(a), sin(a)) * u_refractRoughness * 0.02;
        blurred += sampleScene(screenUv + offsetDir + jitter);
        total += 1.0;
      }
      envColor = blurred / total;
    }
    color = mix(color, envColor + color * 0.15, clamp(u_refractAmount, 0.0, 1.0));
  }

  // u_opaqueness: 0 = fully opaque (default), 1 = fully see-through — matches the reference tool's polarity.
  fragColor = vec4(color, 1.0 - u_opaqueness);
}
`;
