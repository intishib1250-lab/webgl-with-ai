/** Column-major 3x3 matrices for 2D layer transforms, matching WebGL's uniformMatrix3fv layout. */
export type Mat3 = Float32Array;

export function identity(): Mat3 {
  // prettier-ignore
  return new Float32Array([
    1, 0, 0,
    0, 1, 0,
    0, 0, 1,
  ]);
}

export function multiply(a: Mat3, b: Mat3): Mat3 {
  const out = new Float32Array(9);
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 3; row++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) sum += a[k * 3 + row] * b[col * 3 + k];
      out[col * 3 + row] = sum;
    }
  }
  return out;
}

/** Orthographic projection mapping pixel space [0,w]x[0,h] (y-down) to clip space [-1,1]. */
export function ortho(width: number, height: number): Mat3 {
  // prettier-ignore
  return new Float32Array([
    2 / width, 0, 0,
    0, -2 / height, 0,
    -1, 1, 1,
  ]);
}

export function translation(x: number, y: number): Mat3 {
  // prettier-ignore
  return new Float32Array([
    1, 0, 0,
    0, 1, 0,
    x, y, 1,
  ]);
}

export function rotation(radians: number): Mat3 {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  // prettier-ignore
  return new Float32Array([
    c, s, 0,
    -s, c, 0,
    0, 0, 1,
  ]);
}

export function scaling(x: number, y: number): Mat3 {
  // prettier-ignore
  return new Float32Array([
    x, 0, 0,
    0, y, 0,
    0, 0, 1,
  ]);
}

/**
 * Builds the model matrix for a layer: a unit quad centered at origin is
 * scaled to (width,height), rotated, then translated to (x,y) — position is
 * the layer's center in canvas pixel space.
 */
export function layerModelMatrix(params: {
  x: number;
  y: number;
  width: number;
  height: number;
  rotationDeg: number;
  scale: number;
}): Mat3 {
  const t = translation(params.x, params.y);
  const r = rotation((params.rotationDeg * Math.PI) / 180);
  const s = scaling((params.width * params.scale) / 2, (params.height * params.scale) / 2);
  return multiply(multiply(t, r), s);
}

export function invert(m: Mat3): Mat3 {
  const [a, b, c, d, e, f, g, h, i] = m;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  const invDet = det !== 0 ? 1 / det : 0;
  // prettier-ignore
  return new Float32Array([
    (e * i - f * h) * invDet, (c * h - b * i) * invDet, (b * f - c * e) * invDet,
    (f * g - d * i) * invDet, (a * i - c * g) * invDet, (c * d - a * f) * invDet,
    (d * h - e * g) * invDet, (b * g - a * h) * invDet, (a * e - b * d) * invDet,
  ]);
}

export function transformPoint(m: Mat3, x: number, y: number): [number, number] {
  const nx = m[0] * x + m[3] * y + m[6];
  const ny = m[1] * x + m[4] * y + m[7];
  return [nx, ny];
}
