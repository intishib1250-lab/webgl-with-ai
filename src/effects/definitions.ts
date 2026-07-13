import { buildEffectShader } from "./shader-template";
import { EffectDefinition } from "./types";

const angle = (key: string, label: string, def = 0) =>
  ({ key, label, type: "angle" as const, min: 0, max: 360, step: 1, default: def });
const num = (key: string, label: string, min: number, max: number, step: number, def: number) =>
  ({ key, label, type: "number" as const, min, max, step, default: def });
const bool = (key: string, label: string, def: boolean) => ({ key, label, type: "boolean" as const, default: def });
const select = (key: string, label: string, options: { value: string; label: string }[], def: string) =>
  ({ key, label, type: "select" as const, options, default: def });

export const NOISE_EFFECT: EffectDefinition = {
  id: "noise",
  label: "Noise / Film Grain",
  category: "stylize",
  params: [
    num("amount", "Amount", 0, 1, 0.01, 0.3),
    num("scale", "Scale", 0.5, 20, 0.1, 4),
    num("speed", "Speed", 0, 5, 0.05, 1),
    bool("monochrome", "Monochrome", true),
  ],
  fragmentShader: buildEffectShader(
    `
uniform float u_amount;
uniform float u_scale;
uniform bool u_monochrome;
`,
    `
  vec4 src = texture(u_input, uv);
  vec2 grainUv = uv * u_resolution / u_scale + u_time * 37.0;
  float g = hash21(floor(grainUv));
  vec3 grain = u_monochrome ? vec3(g) : vec3(hash21(floor(grainUv)), hash21(floor(grainUv) + 11.0), hash21(floor(grainUv) + 23.0));
  vec3 result = src.rgb + (grain - 0.5) * u_amount;
  fragColor = vec4(clamp(result, 0.0, 1.0), src.a);
`,
  ),
};

export const WAVE_EFFECT: EffectDefinition = {
  id: "wave",
  label: "Wave / Sine Distortion",
  category: "distort",
  params: [
    num("amplitude", "Amplitude", 0, 0.2, 0.001, 0.02),
    num("frequency", "Frequency", 0.5, 40, 0.1, 8),
    num("speed", "Speed", 0, 5, 0.05, 1),
    angle("direction", "Direction", 0),
    bool("reactToCursor", "React to Cursor", false),
  ],
  fragmentShader: buildEffectShader(
    `
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_direction;
uniform bool u_reactToCursor;
`,
    `
  float rad = radians(u_direction);
  vec2 dir = vec2(cos(rad), sin(rad));
  vec2 perp = vec2(-dir.y, dir.x);
  float along = dot(uv, dir) * u_frequency;
  float amp = u_amplitude;
  if (u_reactToCursor) {
    float d = distance(uv, u_mouse);
    amp *= 1.0 + 2.0 * smoothstep(0.4, 0.0, d);
  }
  float offset = sin(along * 6.28318 + u_time * 3.0) * amp;
  vec2 warped = uv + perp * offset;
  fragColor = texture(u_input, warped);
`,
  ),
};

export const LIQUID_EFFECT: EffectDefinition = {
  id: "liquid",
  label: "Liquid / Flow Distortion",
  category: "distort",
  params: [
    num("strength", "Strength", 0, 0.2, 0.001, 0.03),
    num("scale", "Scale", 0.5, 12, 0.1, 3),
    num("speed", "Speed", 0, 5, 0.05, 0.6),
    bool("reactToCursor", "React to Cursor", false),
  ],
  fragmentShader: buildEffectShader(
    `
uniform float u_strength;
uniform float u_scale;
uniform bool u_reactToCursor;
`,
    `
  vec2 flowUv = uv * u_scale;
  float t = u_time;
  float nx = snoise(flowUv + vec2(t * 0.35, -t * 0.2));
  float ny = snoise(flowUv + vec2(-t * 0.25, t * 0.3) + 19.7);
  vec2 flow = vec2(nx, ny);
  float strength = u_strength;
  if (u_reactToCursor) {
    float d = distance(uv, u_mouse);
    strength *= 1.0 + 3.0 * smoothstep(0.4, 0.0, d);
  }
  vec2 warped = uv + flow * strength;
  fragColor = texture(u_input, warped);
`,
  ),
};

export const RIPPLE_EFFECT: EffectDefinition = {
  id: "ripple",
  label: "Ripple",
  category: "distort",
  params: [
    num("centerX", "Center X", 0, 1, 0.01, 0.5),
    num("centerY", "Center Y", 0, 1, 0.01, 0.5),
    num("amplitude", "Amplitude", 0, 0.1, 0.001, 0.015),
    num("frequency", "Frequency", 1, 60, 0.5, 20),
    num("decay", "Decay", 0, 5, 0.05, 1.5),
    bool("reactToCursor", "Follow Cursor", false),
  ],
  fragmentShader: buildEffectShader(
    `
uniform float u_centerX;
uniform float u_centerY;
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_decay;
uniform bool u_reactToCursor;
`,
    `
  vec2 center = u_reactToCursor ? u_mouse : vec2(u_centerX, u_centerY);
  vec2 aspectUv = (uv - center) * vec2(u_resolution.x / u_resolution.y, 1.0);
  float d = length(aspectUv);
  float wave = sin(d * u_frequency - u_time * 4.0) * u_amplitude;
  float falloff = exp(-d * u_decay * 4.0);
  vec2 dir = d > 0.0001 ? aspectUv / d : vec2(0.0);
  vec2 warped = uv + dir * wave * falloff;
  fragColor = texture(u_input, warped);
`,
  ),
};

export const CHROMATIC_ABERRATION_EFFECT: EffectDefinition = {
  id: "chromaticAberration",
  label: "Chromatic Aberration",
  category: "color",
  params: [
    num("amount", "Amount", 0, 0.05, 0.0005, 0.006),
    angle("angle", "Angle", 0),
    bool("radial", "Radial", true),
  ],
  fragmentShader: buildEffectShader(
    `
uniform float u_amount;
uniform float u_angle;
uniform bool u_radial;
`,
    `
  vec2 dir;
  if (u_radial) {
    vec2 centered = uv - 0.5;
    dir = length(centered) > 0.0001 ? normalize(centered) : vec2(0.0);
  } else {
    float rad = radians(u_angle);
    dir = vec2(cos(rad), sin(rad));
  }
  vec2 offset = dir * u_amount;
  float r = texture(u_input, uv + offset).r;
  float g = texture(u_input, uv).g;
  float b = texture(u_input, uv - offset).b;
  float a = texture(u_input, uv).a;
  fragColor = vec4(r, g, b, a);
`,
  ),
};

export const BLUR_EFFECT: EffectDefinition = {
  id: "blur",
  label: "Blur",
  category: "blur",
  params: [
    select(
      "mode",
      "Mode",
      [
        { value: "gaussian", label: "Gaussian" },
        { value: "radial", label: "Radial / Zoom" },
      ],
      "gaussian",
    ),
    num("radius", "Radius", 0, 40, 0.5, 8),
    num("centerX", "Center X", 0, 1, 0.01, 0.5),
    num("centerY", "Center Y", 0, 1, 0.01, 0.5),
  ],
  fragmentShader: buildEffectShader(
    `
uniform int u_mode;
uniform float u_radius;
uniform float u_centerX;
uniform float u_centerY;
`,
    `
  if (u_mode == 1) {
    vec2 center = vec2(u_centerX, u_centerY);
    vec2 toCenter = uv - center;
    vec4 sum = vec4(0.0);
    const int SAMPLES = 12;
    for (int i = 0; i < SAMPLES; i++) {
      float t = float(i) / float(SAMPLES - 1);
      vec2 sampleUv = center + toCenter * (1.0 - t * u_radius * 0.03);
      sum += texture(u_input, sampleUv);
    }
    fragColor = sum / float(SAMPLES);
  } else {
    vec2 texel = u_radius / u_resolution;
    vec4 sum = vec4(0.0);
    float total = 0.0;
    for (int x = -4; x <= 4; x++) {
      for (int y = -4; y <= 4; y++) {
        vec2 offset = vec2(float(x), float(y));
        float w = exp(-dot(offset, offset) / 8.0);
        sum += texture(u_input, uv + offset * texel) * w;
        total += w;
      }
    }
    fragColor = sum / total;
  }
`,
  ),
};

export const PIXELATE_EFFECT: EffectDefinition = {
  id: "pixelate",
  label: "Pixelate",
  category: "stylize",
  params: [num("cellSize", "Cell Size", 2, 100, 1, 16)],
  fragmentShader: buildEffectShader(
    `
uniform float u_cellSize;
`,
    `
  vec2 cell = u_cellSize / u_resolution;
  vec2 cellUv = (floor(uv / cell) + 0.5) * cell;
  fragColor = texture(u_input, cellUv);
`,
  ),
};

export const HALFTONE_EFFECT: EffectDefinition = {
  id: "halftone",
  label: "Halftone",
  category: "stylize",
  params: [
    num("dotSize", "Dot Size", 2, 60, 1, 10),
    angle("angleDeg", "Angle", 15),
    select(
      "colorMode",
      "Color Mode",
      [
        { value: "mono", label: "Monochrome" },
        { value: "color", label: "Color" },
      ],
      "mono",
    ),
  ],
  fragmentShader: buildEffectShader(
    `
uniform float u_dotSize;
uniform float u_angleDeg;
uniform int u_colorMode;
`,
    `
  float rad = radians(u_angleDeg);
  mat2 rot = mat2(cos(rad), -sin(rad), sin(rad), cos(rad));
  vec2 pixelUv = uv * u_resolution;
  vec2 rotated = rot * pixelUv;
  vec2 cell = floor(rotated / u_dotSize) * u_dotSize + u_dotSize * 0.5;
  vec2 cellCenterPixel = rot * cell;
  vec2 sampleUv = clamp(cellCenterPixel / u_resolution, 0.0, 1.0);
  vec4 src = texture(u_input, sampleUv);
  float b = luminance(src.rgb);
  float dist = distance(rotated, cell);
  float radius = (1.0 - b) * u_dotSize * 0.5;
  float coverage = 1.0 - smoothstep(radius - 1.0, radius + 1.0, dist);
  vec3 dotColor = u_colorMode == 1 ? src.rgb : vec3(1.0);
  vec3 bg = u_colorMode == 1 ? vec3(0.0) : vec3(0.0);
  fragColor = vec4(mix(bg, dotColor, coverage), src.a);
`,
  ),
};

export const ASCII_EFFECT: EffectDefinition = {
  id: "ascii",
  label: "ASCII",
  category: "stylize",
  params: [
    num("cellSize", "Cell Size", 4, 40, 1, 10),
    select(
      "ramp",
      "Character Ramp",
      [
        { value: "standard", label: "Standard" },
        { value: "blocks", label: "Blocks" },
        { value: "binary", label: "Binary" },
      ],
      "standard",
    ),
    select(
      "colorMode",
      "Color Mode",
      [
        { value: "mono", label: "Monochrome" },
        { value: "color", label: "Color" },
      ],
      "mono",
    ),
  ],
  fragmentShader: buildEffectShader(
    `
uniform float u_cellSize;
uniform int u_ramp;
uniform int u_colorMode;
`,
    `
  vec2 cell = u_cellSize / u_resolution;
  vec2 cellId = floor(uv / cell);
  vec2 cellUv = (cellId + 0.5) * cell;
  vec4 src = texture(u_input, cellUv);
  float b = luminance(src.rgb);

  vec2 local = fract(uv / cell);
  float glyph;
  if (u_ramp == 2) {
    glyph = step(0.5, hash21(cellId));
  } else if (u_ramp == 1) {
    vec2 g = floor(local * 2.0);
    float idx = g.x + g.y * 2.0;
    glyph = idx <= floor(b * 4.0) ? 1.0 : 0.0;
  } else {
    float d = distance(local, vec2(0.5));
    glyph = 1.0 - smoothstep(b * 0.5, b * 0.5 + 0.08, d);
  }

  vec3 fg = u_colorMode == 1 ? src.rgb : vec3(1.0);
  vec3 bg = vec3(0.0);
  fragColor = vec4(mix(bg, fg, glyph * step(0.02, b)), src.a);
`,
  ),
};

export const DITHER_EFFECT: EffectDefinition = {
  id: "dither",
  label: "Dither",
  category: "color",
  params: [num("levels", "Levels", 2, 16, 1, 4), num("scale", "Pattern Scale", 1, 8, 1, 1)],
  fragmentShader: buildEffectShader(
    `
uniform float u_levels;
uniform float u_scale;
`,
    `
  mat4 bayer = mat4(
     0.0,  8.0,  2.0, 10.0,
    12.0,  4.0, 14.0,  6.0,
     3.0, 11.0,  1.0,  9.0,
    15.0,  7.0, 13.0,  5.0
  ) / 16.0;
  vec2 pixel = floor(uv * u_resolution / u_scale);
  int xi = int(mod(pixel.x, 4.0));
  int yi = int(mod(pixel.y, 4.0));
  float threshold = bayer[yi][xi];
  vec4 src = texture(u_input, uv);
  vec3 stepped = floor(src.rgb * (u_levels - 1.0) + threshold) / (u_levels - 1.0);
  fragColor = vec4(clamp(stepped, 0.0, 1.0), src.a);
`,
  ),
};

export const BLOOM_EFFECT: EffectDefinition = {
  id: "bloom",
  label: "Bloom / Glow",
  category: "blur",
  params: [
    num("threshold", "Threshold", 0, 1, 0.01, 0.7),
    num("intensity", "Intensity", 0, 3, 0.05, 1),
    num("radius", "Radius", 1, 30, 0.5, 8),
  ],
  fragmentShader: buildEffectShader(
    `
uniform float u_threshold;
uniform float u_intensity;
uniform float u_radius;
`,
    `
  vec4 src = texture(u_input, uv);
  vec2 texel = u_radius / u_resolution;
  vec3 glow = vec3(0.0);
  float total = 0.0;
  for (int x = -4; x <= 4; x++) {
    for (int y = -4; y <= 4; y++) {
      vec2 offset = vec2(float(x), float(y));
      float w = exp(-dot(offset, offset) / 8.0);
      vec3 c = texture(u_input, uv + offset * texel).rgb;
      float l = luminance(c);
      glow += max(c - u_threshold, 0.0) * w * step(u_threshold, l);
      total += w;
    }
  }
  glow /= max(total, 0.0001);
  fragColor = vec4(src.rgb + glow * u_intensity, src.a);
`,
  ),
};

export const DISPLACEMENT_EFFECT: EffectDefinition = {
  id: "displacement",
  label: "Displacement Map",
  category: "distort",
  params: [
    { key: "map", label: "Displacement Map", type: "image", default: null },
    num("strength", "Strength", 0, 0.3, 0.001, 0.05),
    num("scale", "Scale", 0.1, 5, 0.05, 1),
  ],
  fragmentShader: buildEffectShader(
    `
uniform sampler2D u_map;
uniform bool u_hasMap;
uniform float u_strength;
uniform float u_scale;
`,
    `
  if (!u_hasMap) {
    fragColor = texture(u_input, uv);
    return;
  }
  vec2 mapUv = fract(uv * u_scale);
  vec2 disp = texture(u_map, mapUv).rg * 2.0 - 1.0;
  vec2 warped = uv + disp * u_strength;
  fragColor = texture(u_input, warped);
`,
  ),
};

export const MOUSE_FOLLOW_EFFECT: EffectDefinition = {
  id: "mouseFollow",
  label: "Mouse-Follow Distortion",
  category: "distort",
  needsTrailBuffer: true,
  params: [
    num("radius", "Radius", 0.02, 0.6, 0.01, 0.18),
    num("strength", "Strength", 0, 0.4, 0.005, 0.08),
    num("decay", "Decay / Trail Length", 0.8, 0.995, 0.001, 0.94),
  ],
  fragmentShader: buildEffectShader(
    `
uniform sampler2D u_trail;
uniform float u_strength;
`,
    `
  vec4 trail = texture(u_trail, uv);
  vec2 warped = uv + trail.xy * u_strength * trail.a;
  fragColor = texture(u_input, warped);
`,
  ),
};

export const EFFECT_DEFINITIONS: EffectDefinition[] = [
  NOISE_EFFECT,
  WAVE_EFFECT,
  LIQUID_EFFECT,
  RIPPLE_EFFECT,
  CHROMATIC_ABERRATION_EFFECT,
  BLUR_EFFECT,
  PIXELATE_EFFECT,
  HALFTONE_EFFECT,
  ASCII_EFFECT,
  DITHER_EFFECT,
  BLOOM_EFFECT,
  DISPLACEMENT_EFFECT,
  MOUSE_FOLLOW_EFFECT,
];
