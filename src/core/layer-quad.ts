// Keyed per WebGL context — see gl.ts's quadVaoByContext for why this can't be a single global.
const quadVaoByContext = new WeakMap<WebGL2RenderingContext, WebGLVertexArrayObject>();

/** Unit quad in [-1,1] local space with [0,1] UVs, used for all layer content draws. */
export function bindLayerQuad(gl: WebGL2RenderingContext): void {
  let quadVao = quadVaoByContext.get(gl);
  if (!quadVao) {
    quadVao = gl.createVertexArray()!;
    gl.bindVertexArray(quadVao);

    // prettier-ignore
    const positions = new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1, 1,   1, -1,   1, 1,
    ]);
    // prettier-ignore
    const uvs = new Float32Array([
      0, 1,  1, 1,  0, 0,
      0, 0,  1, 1,  1, 0,
    ]);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
    quadVaoByContext.set(gl, quadVao);
  }
  gl.bindVertexArray(quadVao);
}

export function drawLayerQuad(gl: WebGL2RenderingContext): void {
  bindLayerQuad(gl);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindVertexArray(null);
}
