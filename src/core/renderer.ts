import { getEffectDefinition } from "../effects/registry";
import { TRAIL_UPDATE_FRAGMENT_SHADER } from "../effects/trail";
import { hexToRgbaArray, setFillUniforms } from "./fill-glsl";
import { MODEL3D_FRAGMENT_SHADER } from "./model3d-shader";
import {
  FULLSCREEN_VERTEX_SHADER,
  GLProgram,
  PingPong,
  RenderTarget,
  createImageTexture,
  createProgram,
  createRenderTarget,
  deleteRenderTarget,
  drawFullscreenQuad,
  resizeRenderTarget,
  setUniform,
  setUniformInt,
  updateImageTexture,
} from "./gl";
import { drawLayerQuad } from "./layer-quad";
import { layerModelMatrix, ortho } from "./mat3";
import {
  BACKGROUND_FRAGMENT_SHADER,
  BLIT_FRAGMENT_SHADER,
  COMPOSITE_FRAGMENT_SHADER,
  CONTENT_VERTEX_SHADER,
  FULLSCREEN_FILL_VERTEX_SHADER,
  GRADIENT_FRAGMENT_SHADER,
  IMAGE_FRAGMENT_SHADER,
  SHAPE_FRAGMENT_SHADER,
} from "./shaders";
import { BlendMode, EffectInstance, EffectLayer, ImageAsset, Layer, Model3DPrimitive, Scene } from "./scene-types";
import { rasterizeText } from "./text-raster";

type ContentLayer = Exclude<Layer, EffectLayer>;

const BLEND_MODE_INDEX: Record<BlendMode, number> = {
  normal: 0,
  add: 1,
  subtract: 2,
  multiply: 3,
  screen: 4,
  overlay: 5,
  darken: 6,
  lighten: 7,
  colorDodge: 8,
  colorBurn: 9,
  linearBurn: 10,
  hardLight: 11,
  softLight: 12,
  difference: 13,
  exclusion: 14,
  linearLight: 15,
  pinLight: 16,
  vividLight: 17,
};

const SHAPE_KIND_INDEX = { rectangle: 0, ellipse: 1, plane: 2, polygon: 3 } as const;

const MODEL3D_PRIMITIVE_INDEX: Record<Model3DPrimitive, number> = {
  torus: 0,
  box: 1,
  sphere: 2,
  capsule: 3,
  disc: 4,
  cylinder: 5,
  octahedron: 6,
  hexPrism: 7,
  plus: 8,
  spring: 9,
  tricylinder: 10,
  triangle: 11,
  roundedCross: 12,
  roundedBox: 13,
  mergedDiscs: 14,
  rippledSphere: 15,
  top: 16,
  star: 17,
  pyramid: 18,
  asterisk: 19,
  dodecahedron: 20,
  boxFrame: 21,
  custom: 22,
};

const REPEAT_TYPE_INDEX: Record<string, number> = { none: 0, xy: 1, x: 2, y: 3, xyz: 4, radial: 5, radial2: 6 };
const SURFACE_TEXTURE_TYPE_INDEX: Record<string, number> = {
  none: 0,
  image: 1,
  striped: 2,
  wavy: 3,
  beaded: 4,
  diamond: 5,
  linoleum: 6,
};

/** Best-effort single color for a 3D layer's "show background" fill (gradients use their first stop). */
function backgroundColorForMiss(scene: Scene): [number, number, number] {
  const fill = scene.background.fill;
  const hex = fill.type === "solid" ? fill.color : (fill.gradient.stops[0]?.color ?? "#000000ff");
  return hexToRgbaArray(hex).slice(0, 3) as [number, number, number];
}

export interface RenderInput {
  time: number; // seconds, global clock (already scene.animationSpeed-scaled by caller)
  dt: number;
  /** Mouse position in GL UV space (0,0 = bottom-left), clamped to [0,1]. */
  mouseUv: { x: number; y: number };
  mouseVelocity: { x: number; y: number }; // uv-space per second
  renderScale: number;
}

interface TextCacheEntry {
  texture: WebGLTexture;
  signature: string;
}

export class Renderer {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;

  private imageProgram: GLProgram;
  private shapeProgram: GLProgram;
  private gradientProgram: GLProgram;
  private model3dProgram: GLProgram;
  private backgroundProgram: GLProgram;
  private compositeProgram: GLProgram;
  private blitProgram: GLProgram;
  private trailUpdateProgram: GLProgram;
  private effectPrograms = new Map<string, GLProgram>();

  private sceneAccumulator: PingPong;
  private layerEffectPingPong: PingPong;
  private backgroundTarget: RenderTarget;
  private dryScratch: RenderTarget;
  private trailBuffers = new Map<string, PingPong>();
  private interactiveOffsets = new Map<string, { x: number; y: number; vx: number; vy: number }>();

  private assetTextures = new Map<string, WebGLTexture>();
  private assetSignatures = new Map<string, string>();
  private textCache = new Map<string, TextCacheEntry>();

  private width = 1;
  private height = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) throw new Error("WebGL2 is not supported in this browser");
    this.gl = gl;
    gl.getExtension("EXT_color_buffer_float");

    this.imageProgram = createProgram(gl, CONTENT_VERTEX_SHADER, IMAGE_FRAGMENT_SHADER);
    this.shapeProgram = createProgram(gl, CONTENT_VERTEX_SHADER, SHAPE_FRAGMENT_SHADER);
    this.gradientProgram = createProgram(gl, CONTENT_VERTEX_SHADER, GRADIENT_FRAGMENT_SHADER);
    this.model3dProgram = createProgram(gl, CONTENT_VERTEX_SHADER, MODEL3D_FRAGMENT_SHADER);
    this.backgroundProgram = createProgram(gl, FULLSCREEN_FILL_VERTEX_SHADER, BACKGROUND_FRAGMENT_SHADER);
    this.compositeProgram = createProgram(gl, FULLSCREEN_VERTEX_SHADER, COMPOSITE_FRAGMENT_SHADER);
    this.blitProgram = createProgram(gl, FULLSCREEN_VERTEX_SHADER, BLIT_FRAGMENT_SHADER);
    this.trailUpdateProgram = createProgram(gl, FULLSCREEN_VERTEX_SHADER, TRAIL_UPDATE_FRAGMENT_SHADER);

    this.sceneAccumulator = new PingPong(gl, 1, 1);
    this.layerEffectPingPong = new PingPong(gl, 1, 1);
    this.backgroundTarget = createRenderTarget(gl, 1, 1);
    this.dryScratch = createRenderTarget(gl, 1, 1);
  }

  private getEffectProgram(effectId: string): GLProgram | null {
    let program = this.effectPrograms.get(effectId);
    if (program) return program;
    const definition = getEffectDefinition(effectId);
    if (!definition) return null;
    program = createProgram(this.gl, FULLSCREEN_VERTEX_SHADER, definition.fragmentShader);
    this.effectPrograms.set(effectId, program);
    return program;
  }

  resize(width: number, height: number): void {
    const gl = this.gl;
    width = Math.max(1, Math.round(width));
    height = Math.max(1, Math.round(height));
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.sceneAccumulator.resize(gl, width, height);
    this.layerEffectPingPong.resize(gl, width, height);
    resizeRenderTarget(gl, this.backgroundTarget, width, height);
    resizeRenderTarget(gl, this.dryScratch, width, height);
    for (const trail of this.trailBuffers.values()) trail.resize(gl, width, height);
  }

  /** Uploads/updates the GL texture for an image asset if its data changed. */
  syncAsset(asset: ImageAsset, image: HTMLImageElement | ImageBitmap): void {
    const signature = `${asset.id}:${asset.dataUrl.length}`;
    const existing = this.assetTextures.get(asset.id);
    if (existing && this.assetSignatures.get(asset.id) === signature) return;
    if (existing) {
      updateImageTexture(this.gl, existing, image);
    } else {
      this.assetTextures.set(asset.id, createImageTexture(this.gl, image));
    }
    this.assetSignatures.set(asset.id, signature);
  }

  removeAsset(assetId: string): void {
    const texture = this.assetTextures.get(assetId);
    if (texture) this.gl.deleteTexture(texture);
    this.assetTextures.delete(assetId);
    this.assetSignatures.delete(assetId);
  }

  private getOrCreateTrailBuffer(effectInstanceId: string): PingPong {
    let trail = this.trailBuffers.get(effectInstanceId);
    if (!trail) {
      trail = new PingPong(this.gl, this.width, this.height);
      this.trailBuffers.set(effectInstanceId, trail);
    }
    return trail;
  }

  pruneTrailBuffers(activeEffectInstanceIds: Set<string>): void {
    for (const [id, trail] of this.trailBuffers) {
      if (!activeEffectInstanceIds.has(id)) {
        trail.dispose(this.gl);
        this.trailBuffers.delete(id);
      }
    }
  }

  private drawTextLayerTexture(layer: Extract<Layer, { type: "text" }>): WebGLTexture {
    const signature = JSON.stringify([
      layer.content,
      layer.fontFamily,
      layer.fontWeight,
      layer.fontSize,
      layer.letterSpacing,
      layer.lineHeight,
      layer.align,
      layer.fill,
      layer.width,
      layer.height,
    ]);
    const cached = this.textCache.get(layer.id);
    if (cached && cached.signature === signature) return cached.texture;

    const canvas = rasterizeText(layer);
    const texture = cached ? cached.texture : createImageTexture(this.gl, canvas);
    if (cached) updateImageTexture(this.gl, texture, canvas);
    this.textCache.set(layer.id, { texture, signature });
    return texture;
  }

  private renderLayerContent(
    layer: ContentLayer,
    target: RenderTarget,
    scene: Scene,
    input: RenderInput,
    getAssetTexture: (assetId: string) => WebGLTexture | null,
  ): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const projection = ortho(scene.size.width, scene.size.height);
    const model = layerModelMatrix({
      x: layer.transform.x,
      y: layer.transform.y,
      width: layer.width,
      height: layer.height,
      rotationDeg: layer.transform.rotationDeg,
      scale: layer.transform.scale,
    });

    if (layer.type === "image") {
      const texture = layer.assetId ? this.assetTextures.get(layer.assetId) : null;
      if (!texture) return;
      gl.useProgram(this.imageProgram.program);
      setUniform(gl, this.imageProgram, "u_model", model);
      setUniform(gl, this.imageProgram, "u_projection", projection);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      setUniformInt(gl, this.imageProgram, "u_texture", 0);
      drawLayerQuad(gl);
      return;
    }

    if (layer.type === "text") {
      const texture = this.drawTextLayerTexture(layer);
      gl.useProgram(this.imageProgram.program);
      setUniform(gl, this.imageProgram, "u_model", model);
      setUniform(gl, this.imageProgram, "u_projection", projection);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      setUniformInt(gl, this.imageProgram, "u_texture", 0);
      drawLayerQuad(gl);
      return;
    }

    if (layer.type === "shape") {
      gl.useProgram(this.shapeProgram.program);
      setUniform(gl, this.shapeProgram, "u_model", model);
      setUniform(gl, this.shapeProgram, "u_projection", projection);
      setUniform(gl, this.shapeProgram, "u_size", [layer.width, layer.height]);
      setUniform(gl, this.shapeProgram, "u_cornerRadius", layer.cornerRadius);
      setUniform(gl, this.shapeProgram, "u_sides", layer.sides);
      setUniformInt(gl, this.shapeProgram, "u_shapeKind", SHAPE_KIND_INDEX[layer.shape]);
      setFillUniforms(gl, this.shapeProgram, layer.fill);
      drawLayerQuad(gl);
      return;
    }

    if (layer.type === "gradient") {
      gl.useProgram(this.gradientProgram.program);
      setUniform(gl, this.gradientProgram, "u_model", model);
      setUniform(gl, this.gradientProgram, "u_projection", projection);
      setFillUniforms(gl, this.gradientProgram, { type: "gradient", gradient: layer.gradient });
      drawLayerQuad(gl);
      return;
    }

    // model3d layer
    const program = this.model3dProgram;
    gl.useProgram(program.program);
    setUniform(gl, program, "u_model", model);
    setUniform(gl, program, "u_projection", projection);
    setUniform(gl, program, "u_aspect", layer.width / layer.height);
    setUniform(gl, program, "u_fov", layer.fov);
    setUniform(gl, program, "u_canvasResolution", [this.width, this.height]);
    setUniform(gl, program, "u_rotationDeg", [layer.rotation3d.x, layer.rotation3d.y, layer.rotation3d.z]);
    setUniform(gl, program, "u_time", input.time);
    setUniform(gl, program, "u_animSpeed", layer.animationSpeed);
    setUniform(gl, program, "u_animDirection", [layer.animationDirection.x, layer.animationDirection.y, layer.animationDirection.z]);

    const mouseTargetX = (input.mouseUv.x - 0.5) * 2.4;
    const mouseTargetY = (input.mouseUv.y - 0.5) * 2.4;
    const interactive = this.updateInteractiveOffset(layer.id, mouseTargetX, mouseTargetY, layer.momentum, layer.spring, input.dt);
    setUniform(gl, program, "u_interactiveOffset", [interactive.x, interactive.y]);
    setUniform(gl, program, "u_trackMouseAmount", layer.trackMouseAmount);
    setUniformInt(gl, program, "u_mouseAxes", layer.mouseAxes === "x" ? 0 : layer.mouseAxes === "y" ? 1 : 2);
    setUniform(gl, program, "u_axisTilt", layer.axisTilt);

    setUniformInt(gl, program, "u_primitive", MODEL3D_PRIMITIVE_INDEX[layer.primitive]);
    setUniform(gl, program, "u_scale3d", layer.scale3d);
    setUniform(gl, program, "u_twist", [layer.twist.x, layer.twist.y]);
    setUniform(gl, program, "u_rounding", layer.rounding);
    setUniform(gl, program, "u_variation", layer.variation);
    setUniform(gl, program, "u_smoothing", layer.smoothing);
    setUniform(gl, program, "u_extrude", layer.extrude);
    setUniform(gl, program, "u_mix", layer.mix);

    setUniformInt(gl, program, "u_repeatType", REPEAT_TYPE_INDEX[layer.repeatType]);
    // layer.repeatSpacing is a 0..1 UI fraction (Spacing slider) — remap to the world-space period the shader expects.
    setUniform(gl, program, "u_repeatSpacing", 0.3 + layer.repeatSpacing * 5.7);

    setUniformInt(gl, program, "u_showBackground", layer.showBackground ? 1 : 0);
    setUniform(gl, program, "u_backgroundColor", backgroundColorForMiss(scene));

    setUniform(gl, program, "u_refractAmount", layer.refraction.amount);
    setUniformInt(gl, program, "u_refractBehavior", layer.refraction.behavior === "reflect" ? 1 : 0);
    setUniform(gl, program, "u_dispersion", layer.refraction.dispersion);
    setUniform(gl, program, "u_refractRoughness", layer.refraction.roughness);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneAccumulator.read.texture);
    setUniformInt(gl, program, "u_sceneTexture", 2);

    setUniformInt(gl, program, "u_surfaceTextureType", SURFACE_TEXTURE_TYPE_INDEX[layer.surfaceTexture.type]);
    setUniform(gl, program, "u_surfaceTextureAmount", layer.surfaceTexture.amount);
    // layer.surfaceTexture.scale is a 0..1 UI fraction (Scale slider) — remap to the world-space texture scale the shader expects.
    setUniform(gl, program, "u_surfaceTextureScale", 0.1 + layer.surfaceTexture.scale * 3.9);
    setUniform(gl, program, "u_materialColor", hexToRgbaArray(layer.material.color).slice(0, 3));
    setUniform(gl, program, "u_roughness", layer.material.roughness);
    setUniform(gl, program, "u_metalness", layer.material.metalness);

    setUniform(gl, program, "u_lightPosition", [layer.light.positionX, layer.light.positionY, layer.light.positionZ]);
    setUniform(gl, program, "u_specular", layer.light.specular);
    setUniform(gl, program, "u_fresnel", layer.light.fresnel);
    setUniform(gl, program, "u_lightColor", hexToRgbaArray(layer.light.color).slice(0, 3));
    setUniform(gl, program, "u_opaqueness", layer.light.opaqueness);

    const texture = layer.textureAssetId ? getAssetTexture(layer.textureAssetId) : null;
    setUniformInt(gl, program, "u_hasTexture", texture ? 1 : 0);
    if (texture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      setUniformInt(gl, program, "u_texture", 0);
    }

    const customMapTexture = layer.customMapAssetId ? getAssetTexture(layer.customMapAssetId) : null;
    setUniformInt(gl, program, "u_hasCustomMap", customMapTexture ? 1 : 0);
    if (customMapTexture) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, customMapTexture);
      setUniformInt(gl, program, "u_customMap", 1);
    }

    drawLayerQuad(gl);
  }

  /** Spring-damper toward the raw cursor target, so 3D layer interactivity has momentum instead of snapping. */
  private updateInteractiveOffset(
    layerId: string,
    targetX: number,
    targetY: number,
    momentum: number,
    spring: number,
    dt: number,
  ): { x: number; y: number } {
    let state = this.interactiveOffsets.get(layerId);
    if (!state) {
      state = { x: 0, y: 0, vx: 0, vy: 0 };
      this.interactiveOffsets.set(layerId, state);
    }
    const stiffness = 2 + spring * 38;
    const damping = 8 - momentum * 7.5;
    const clampedDt = Math.min(dt, 0.05);
    const ax = (targetX - state.x) * stiffness - state.vx * damping;
    const ay = (targetY - state.y) * stiffness - state.vy * damping;
    state.vx += ax * clampedDt;
    state.vy += ay * clampedDt;
    state.x += state.vx * clampedDt;
    state.y += state.vy * clampedDt;
    return { x: state.x, y: state.y };
  }

  private applyEffectStack(
    effects: EffectInstance[],
    pingPong: PingPong,
    input: RenderInput,
    getAssetTexture: (assetId: string) => WebGLTexture | null,
  ): void {
    const gl = this.gl;
    for (const instance of effects) {
      if (!instance.enabled) continue;
      const program = this.getEffectProgram(instance.effectId);
      const definition = getEffectDefinition(instance.effectId);
      if (!program || !definition) continue;

      const needsBlend = instance.blendMode !== "normal" || instance.mix < 1;
      if (needsBlend) this.copyTexture(pingPong.read.texture, this.dryScratch);

      let trailReadTexture: WebGLTexture | null = null;
      if (definition.needsTrailBuffer) {
        const trail = this.getOrCreateTrailBuffer(instance.id);
        gl.bindFramebuffer(gl.FRAMEBUFFER, trail.write.framebuffer);
        gl.viewport(0, 0, trail.write.width, trail.write.height);
        gl.disable(gl.BLEND);
        gl.useProgram(this.trailUpdateProgram.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, trail.read.texture);
        setUniformInt(gl, this.trailUpdateProgram, "u_prevTrail", 0);
        setUniform(gl, this.trailUpdateProgram, "u_mouse", [input.mouseUv.x, input.mouseUv.y]);
        setUniform(gl, this.trailUpdateProgram, "u_mouseVelocity", [input.mouseVelocity.x, input.mouseVelocity.y]);
        setUniform(gl, this.trailUpdateProgram, "u_decay", Number(instance.params.decay ?? 0.94));
        setUniform(gl, this.trailUpdateProgram, "u_dt", input.dt);
        setUniform(gl, this.trailUpdateProgram, "u_radius", Number(instance.params.radius ?? 0.18));
        drawFullscreenQuad(gl);
        trail.swap();
        trailReadTexture = trail.read.texture;
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, pingPong.write.framebuffer);
      gl.viewport(0, 0, pingPong.write.width, pingPong.write.height);
      gl.disable(gl.BLEND);
      gl.useProgram(program.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pingPong.read.texture);
      setUniformInt(gl, program, "u_input", 0);
      setUniform(gl, program, "u_resolution", [pingPong.write.width, pingPong.write.height]);
      setUniform(gl, program, "u_time", input.time * instance.speed);
      setUniform(gl, program, "u_mouse", [input.mouseUv.x, input.mouseUv.y]);
      setUniform(gl, program, "u_mouseVelocity", [input.mouseVelocity.x, input.mouseVelocity.y]);

      let textureUnit = 1;
      for (const paramDef of definition.params) {
        const value = instance.params[paramDef.key];
        const uniformName = `u_${paramDef.key}`;
        if (paramDef.type === "boolean") {
          setUniformInt(gl, program, uniformName, value ? 1 : 0);
        } else if (paramDef.type === "select") {
          const index = paramDef.options.findIndex((o) => o.value === value);
          setUniformInt(gl, program, uniformName, Math.max(0, index));
        } else if (paramDef.type === "color") {
          // colors as hex strings aren't used by current effects, reserved for future params
        } else if (paramDef.type === "image") {
          const assetId = typeof value === "string" ? value : null;
          const texture = assetId ? getAssetTexture(assetId) : null;
          setUniformInt(gl, program, "u_hasMap", texture ? 1 : 0);
          if (texture) {
            gl.activeTexture(gl.TEXTURE0 + textureUnit);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            setUniformInt(gl, program, uniformName, textureUnit);
            textureUnit++;
          }
        } else {
          setUniform(gl, program, uniformName, Number(value));
        }
      }

      if (trailReadTexture) {
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, trailReadTexture);
        setUniformInt(gl, program, "u_trail", textureUnit);
        textureUnit++;
      }

      drawFullscreenQuad(gl);
      pingPong.swap();

      if (needsBlend) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, pingPong.write.framebuffer);
        gl.viewport(0, 0, pingPong.write.width, pingPong.write.height);
        gl.disable(gl.BLEND);
        gl.useProgram(this.compositeProgram.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.dryScratch.texture);
        setUniformInt(gl, this.compositeProgram, "u_dst", 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, pingPong.read.texture);
        setUniformInt(gl, this.compositeProgram, "u_src", 1);
        setUniformInt(gl, this.compositeProgram, "u_mode", BLEND_MODE_INDEX[instance.blendMode]);
        setUniform(gl, this.compositeProgram, "u_opacity", instance.mix);
        drawFullscreenQuad(gl);
        pingPong.swap();
      }
    }
  }

  private compositeOnto(dst: PingPong, srcTexture: WebGLTexture, blendMode: BlendMode, opacity: number): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.write.framebuffer);
    gl.viewport(0, 0, dst.write.width, dst.write.height);
    gl.disable(gl.BLEND);
    gl.useProgram(this.compositeProgram.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dst.read.texture);
    setUniformInt(gl, this.compositeProgram, "u_dst", 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, srcTexture);
    setUniformInt(gl, this.compositeProgram, "u_src", 1);
    setUniformInt(gl, this.compositeProgram, "u_mode", BLEND_MODE_INDEX[blendMode]);
    setUniform(gl, this.compositeProgram, "u_opacity", opacity);
    drawFullscreenQuad(gl);
    dst.swap();
  }

  private copyTexture(srcTexture: WebGLTexture, dst: RenderTarget): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.framebuffer);
    gl.viewport(0, 0, dst.width, dst.height);
    gl.disable(gl.BLEND);
    gl.useProgram(this.blitProgram.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTexture);
    setUniformInt(gl, this.blitProgram, "u_input", 0);
    drawFullscreenQuad(gl);
  }

  /** Adjustment-layer style: runs one effect directly on the scene accumulator, post-processing everything composited so far. */
  private applyEffectLayer(
    layer: EffectLayer,
    input: RenderInput,
    getAssetTexture: (assetId: string) => WebGLTexture | null,
  ): void {
    const instance: EffectInstance = {
      id: layer.id,
      effectId: layer.effectId,
      enabled: true,
      speed: layer.speed,
      blendMode: layer.blendMode,
      mix: layer.opacity,
      params: layer.params,
    };
    this.applyEffectStack([instance], this.sceneAccumulator, input, getAssetTexture);
  }

  render(scene: Scene, input: RenderInput): void {
    const gl = this.gl;
    const width = Math.max(1, Math.round(scene.size.width * input.renderScale));
    const height = Math.max(1, Math.round(scene.size.height * input.renderScale));
    this.resize(width, height);

    const getAssetTexture = (assetId: string) => this.assetTextures.get(assetId) ?? null;

    // 1. Background into the scene accumulator.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneAccumulator.read.framebuffer);
    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);
    gl.useProgram(this.backgroundProgram.program);
    setFillUniforms(gl, this.backgroundProgram, scene.background.fill);
    drawFullscreenQuad(gl);

    // 2. Layers bottom-to-top. Effect layers post-process everything composited so far
    // (adjustment-layer style); content layers render, run their own effect stack, and composite.
    for (const layer of scene.layers) {
      if (!layer.visible) continue;

      if (layer.type === "effect") {
        this.applyEffectLayer(layer, input, getAssetTexture);
        continue;
      }

      this.renderLayerContent(layer, this.layerEffectPingPong.write, scene, input, getAssetTexture);
      this.layerEffectPingPong.swap();

      this.applyEffectStack(layer.effects, this.layerEffectPingPong, input, getAssetTexture);

      this.compositeOnto(this.sceneAccumulator, this.layerEffectPingPong.read.texture, layer.blendMode, layer.opacity);
    }

    // 3. Scene-level effects.
    this.applyEffectStack(scene.effects, this.sceneAccumulator, input, getAssetTexture);

    // 4. Blit to the visible canvas.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.BLEND);
    gl.useProgram(this.blitProgram.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneAccumulator.read.texture);
    setUniformInt(gl, this.blitProgram, "u_input", 0);
    drawFullscreenQuad(gl);
  }

  dispose(): void {
    const gl = this.gl;
    this.sceneAccumulator.dispose(gl);
    this.layerEffectPingPong.dispose(gl);
    deleteRenderTarget(gl, this.dryScratch);
    for (const trail of this.trailBuffers.values()) trail.dispose(gl);
    for (const texture of this.assetTextures.values()) gl.deleteTexture(texture);
    for (const entry of this.textCache.values()) gl.deleteTexture(entry.texture);
  }
}
