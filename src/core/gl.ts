export function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}\n${annotateSource(source)}`);
  }
  return shader;
}

function annotateSource(source: string): string {
  return source
    .split("\n")
    .map((line, i) => `${i + 1}: ${line}`)
    .join("\n");
}

export interface GLProgram {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation>;
  attribs: Map<string, number>;
}

export function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): GLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info}`);
  }

  const uniforms = new Map<string, WebGLUniformLocation>();
  const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < uniformCount; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const name = info.name.replace(/\[0\]$/, "");
    const location = gl.getUniformLocation(program, name);
    if (location) uniforms.set(name, location);
  }

  const attribs = new Map<string, number>();
  const attribCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) as number;
  for (let i = 0; i < attribCount; i++) {
    const info = gl.getActiveAttrib(program, i);
    if (!info) continue;
    attribs.set(info.name, gl.getAttribLocation(program, info.name));
  }

  return { program, uniforms, attribs };
}

export function setUniform(
  gl: WebGL2RenderingContext,
  program: GLProgram,
  name: string,
  value: number | number[] | Float32Array,
): void {
  const location = program.uniforms.get(name);
  if (!location) return;
  if (typeof value === "number") {
    gl.uniform1f(location, value);
    return;
  }
  const values = value instanceof Float32Array ? value : new Float32Array(value);
  switch (values.length) {
    case 1:
      gl.uniform1fv(location, values);
      break;
    case 2:
      gl.uniform2fv(location, values);
      break;
    case 3:
      gl.uniform3fv(location, values);
      break;
    case 4:
      gl.uniform4fv(location, values);
      break;
    case 9:
      gl.uniformMatrix3fv(location, false, values);
      break;
    case 16:
      gl.uniformMatrix4fv(location, false, values);
      break;
    default:
      throw new Error(`Unsupported uniform vector length: ${values.length}`);
  }
}

export function setUniformInt(gl: WebGL2RenderingContext, program: GLProgram, name: string, value: number): void {
  const location = program.uniforms.get(name);
  if (!location) return;
  gl.uniform1i(location, value);
}

export interface RenderTarget {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}

export function createRenderTarget(gl: WebGL2RenderingContext, width: number, height: number): RenderTarget {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Failed to create texture");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) throw new Error("Failed to create framebuffer");
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { framebuffer, texture, width, height };
}

export function resizeRenderTarget(gl: WebGL2RenderingContext, target: RenderTarget, width: number, height: number): void {
  if (target.width === width && target.height === height) return;
  gl.bindTexture(gl.TEXTURE_2D, target.texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  target.width = width;
  target.height = height;
}

export function deleteRenderTarget(gl: WebGL2RenderingContext, target: RenderTarget): void {
  gl.deleteTexture(target.texture);
  gl.deleteFramebuffer(target.framebuffer);
}

/** Ping-pong pair for iterative full-screen passes (effect stacks). */
export class PingPong {
  private targets: [RenderTarget, RenderTarget];
  private index = 0;

  constructor(gl: WebGL2RenderingContext, width: number, height: number) {
    this.targets = [createRenderTarget(gl, width, height), createRenderTarget(gl, width, height)];
  }

  get read(): RenderTarget {
    return this.targets[this.index];
  }

  get write(): RenderTarget {
    return this.targets[1 - this.index];
  }

  swap(): void {
    this.index = 1 - this.index;
  }

  resize(gl: WebGL2RenderingContext, width: number, height: number): void {
    resizeRenderTarget(gl, this.targets[0], width, height);
    resizeRenderTarget(gl, this.targets[1], width, height);
  }

  dispose(gl: WebGL2RenderingContext): void {
    deleteRenderTarget(gl, this.targets[0]);
    deleteRenderTarget(gl, this.targets[1]);
  }
}

// Keyed per WebGL context — the editor and export/embed paths can all have
// their own live GL context at once, and VAOs aren't shareable across them.
const quadVaoByContext = new WeakMap<WebGL2RenderingContext, WebGLVertexArrayObject>();

/** Shared clip-space fullscreen triangle (no buffer needed beyond one VAO). */
export function bindFullscreenQuad(gl: WebGL2RenderingContext): void {
  let quadVao = quadVaoByContext.get(gl);
  if (!quadVao) {
    quadVao = gl.createVertexArray()!;
    const buffer = gl.createBuffer();
    gl.bindVertexArray(quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // Single triangle covering the viewport, UV derived in vertex shader.
    const verts = new Float32Array([-1, -1, 3, -1, -1, 3]);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    quadVaoByContext.set(gl, quadVao);
  }
  gl.bindVertexArray(quadVao);
}

export function drawFullscreenQuad(gl: WebGL2RenderingContext): void {
  bindFullscreenQuad(gl);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindVertexArray(null);
}

export function createImageTexture(gl: WebGL2RenderingContext, source: TexImageSource): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Failed to create texture");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  return texture;
}

export function updateImageTexture(gl: WebGL2RenderingContext, texture: WebGLTexture, source: TexImageSource): void {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
}

export const FULLSCREEN_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;
