(function(){var e=new Set([`noise`,`wave`,`liquid`,`ripple`,`mouseFollow`]);function t(t){let n=t=>t.some(t=>t.enabled&&e.has(t.effectId));return n(t.effects)?!0:t.layers.some(t=>t.visible?t.type===`effect`?e.has(t.effectId):t.type===`model3d`?t.animationSpeed!==0||t.trackMouseAmount>0:n(t.effects):!1)}function n(e,t,n){let i=e.createShader(t);if(!i)throw Error(`Failed to create shader`);if(e.shaderSource(i,n),e.compileShader(i),!e.getShaderParameter(i,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(i);throw e.deleteShader(i),Error(`Shader compile error: ${t}\n${r(n)}`)}return i}function r(e){return e.split(`
`).map((e,t)=>`${t+1}: ${e}`).join(`
`)}function i(e,t,r){let i=n(e,e.VERTEX_SHADER,t),a=n(e,e.FRAGMENT_SHADER,r),o=e.createProgram();if(!o)throw Error(`Failed to create program`);if(e.attachShader(o,i),e.attachShader(o,a),e.linkProgram(o),e.deleteShader(i),e.deleteShader(a),!e.getProgramParameter(o,e.LINK_STATUS)){let t=e.getProgramInfoLog(o);throw e.deleteProgram(o),Error(`Program link error: ${t}`)}let s=new Map,c=e.getProgramParameter(o,e.ACTIVE_UNIFORMS);for(let t=0;t<c;t++){let n=e.getActiveUniform(o,t);if(!n)continue;let r=n.name.replace(/\[0\]$/,``),i=e.getUniformLocation(o,r);i&&s.set(r,i)}let l=new Map,u=e.getProgramParameter(o,e.ACTIVE_ATTRIBUTES);for(let t=0;t<u;t++){let n=e.getActiveAttrib(o,t);n&&l.set(n.name,e.getAttribLocation(o,n.name))}return{program:o,uniforms:s,attribs:l}}function a(e,t,n,r){let i=t.uniforms.get(n);if(!i)return;if(typeof r==`number`){e.uniform1f(i,r);return}let a=r instanceof Float32Array?r:new Float32Array(r);switch(a.length){case 1:e.uniform1fv(i,a);break;case 2:e.uniform2fv(i,a);break;case 3:e.uniform3fv(i,a);break;case 4:e.uniform4fv(i,a);break;case 9:e.uniformMatrix3fv(i,!1,a);break;case 16:e.uniformMatrix4fv(i,!1,a);break;default:throw Error(`Unsupported uniform vector length: ${a.length}`)}}function o(e,t,n,r){let i=t.uniforms.get(n);i&&e.uniform1i(i,r)}function s(e,t,n){let r=e.createTexture();if(!r)throw Error(`Failed to create texture`);e.bindTexture(e.TEXTURE_2D,r),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,t,n,0,e.RGBA,e.UNSIGNED_BYTE,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);let i=e.createFramebuffer();if(!i)throw Error(`Failed to create framebuffer`);return e.bindFramebuffer(e.FRAMEBUFFER,i),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,r,0),e.bindFramebuffer(e.FRAMEBUFFER,null),{framebuffer:i,texture:r,width:t,height:n}}function c(e,t,n,r){t.width===n&&t.height===r||(e.bindTexture(e.TEXTURE_2D,t.texture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,n,r,0,e.RGBA,e.UNSIGNED_BYTE,null),t.width=n,t.height=r)}function l(e,t){e.deleteTexture(t.texture),e.deleteFramebuffer(t.framebuffer)}var u=class{targets;index=0;constructor(e,t,n){this.targets=[s(e,t,n),s(e,t,n)]}get read(){return this.targets[this.index]}get write(){return this.targets[1-this.index]}swap(){this.index=1-this.index}resize(e,t,n){c(e,this.targets[0],t,n),c(e,this.targets[1],t,n)}dispose(e){l(e,this.targets[0]),l(e,this.targets[1])}},d=new WeakMap;function f(e){let t=d.get(e);if(!t){t=e.createVertexArray();let n=e.createBuffer();e.bindVertexArray(t),e.bindBuffer(e.ARRAY_BUFFER,n);let r=new Float32Array([-1,-1,3,-1,-1,3]);e.bufferData(e.ARRAY_BUFFER,r,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindVertexArray(null),d.set(e,t)}e.bindVertexArray(t)}function p(e){f(e),e.drawArrays(e.TRIANGLES,0,3),e.bindVertexArray(null)}function m(e,t){let n=e.createTexture();if(!n)throw Error(`Failed to create texture`);return e.bindTexture(e.TEXTURE_2D,n),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,t),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.generateMipmap(e.TEXTURE_2D),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),n}function h(e,t,n){e.bindTexture(e.TEXTURE_2D,t),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,n),e.generateMipmap(e.TEXTURE_2D),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1)}var g=`#version 300 es
layout(location = 0) in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`,_=`
uniform int u_fillType; // 0 = solid, 1 = gradient
uniform vec4 u_solidColor;
uniform int u_gradKind; // 0 = linear, 1 = radial, 2 = mesh
uniform float u_gradAngle;
uniform float u_stopOffsets[6];
uniform vec4 u_stopColors[6];
uniform int u_stopCount;
uniform vec4 u_meshCorners[4];
uniform float u_meshWarp;

vec4 sampleGradientStops(float t) {
  t = clamp(t, 0.0, 1.0);
  if (u_stopCount <= 1) return u_stopColors[0];
  for (int i = 0; i < 6 - 1; i++) {
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
`;function v(e,t,n){if(n.type===`solid`){o(e,t,`u_fillType`,0),a(e,t,`u_solidColor`,y(n.color));return}o(e,t,`u_fillType`,1);let r=n.gradient;if(o(e,t,`u_gradKind`,r.kind===`linear`?0:r.kind===`radial`?1:2),a(e,t,`u_gradAngle`,r.angleDeg),a(e,t,`u_meshWarp`,r.meshWarp??0),r.kind===`mesh`){let n=(r.meshCorners??[`#ff7a33ff`,`#ff8f52ff`,`#1a0f08ff`,`#0b0b0cff`]).flatMap(e=>y(e)),i=t.uniforms.get(`u_meshCorners`);i&&e.uniform4fv(i,new Float32Array(n))}let i=r.stops.slice(0,6);o(e,t,`u_stopCount`,i.length);let s=new Float32Array(6),c=new Float32Array(24);i.forEach((e,t)=>{s[t]=e.offset;let n=y(e.color);c.set(n,t*4)});let l=t.uniforms.get(`u_stopOffsets`);l&&e.uniform1fv(l,s);let u=t.uniforms.get(`u_stopColors`);u&&e.uniform4fv(u,c)}function y(e){let t=e.replace(`#`,``);return[parseInt(t.slice(0,2)||`00`,16)/255,parseInt(t.slice(2,4)||`00`,16)/255,parseInt(t.slice(4,6)||`00`,16)/255,t.length>=8?parseInt(t.slice(6,8),16)/255:1]}var b=`
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
`,x=`#version 300 es
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
`,S=`#version 300 es
precision highp float;
uniform sampler2D u_texture;
in vec2 v_uv;
out vec4 fragColor;
void main() {
  fragColor = texture(u_texture, v_uv);
}
`,C=`#version 300 es
layout(location = 0) in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`,w=`#version 300 es
precision highp float;
uniform vec2 u_size;
uniform float u_cornerRadius;
uniform int u_shapeKind; // 0 rectangle, 1 ellipse, 2 plane, 3 polygon
uniform float u_sides;
${b}
${_}
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
`,T=`#version 300 es
precision highp float;
${b}
${_}
in vec2 v_uv;
out vec4 fragColor;
void main() {
  fragColor = evalFill(v_uv);
}
`,ee=T,te=`#version 300 es
precision highp float;
uniform sampler2D u_dst;
uniform sampler2D u_src;
uniform int u_mode;
uniform float u_opacity;

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
`,E=`#version 300 es
precision highp float;
uniform sampler2D u_input;
in vec2 v_uv;
out vec4 fragColor;
void main() {
  fragColor = texture(u_input, v_uv);
}
`,D=`
uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_mouseVelocity;
`,O=`
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
`;function k(e,t,n=``){return`#version 300 es
precision highp float;
${D}
${e}
in vec2 v_uv;
out vec4 fragColor;
${b}
${O}
${n}
void main() {
  vec2 uv = v_uv;
  ${t}
}
`}var A=(e,t,n=0)=>({key:e,label:t,type:`angle`,min:0,max:360,step:1,default:n}),j=(e,t,n,r,i,a)=>({key:e,label:t,type:`number`,min:n,max:r,step:i,default:a}),M=(e,t,n)=>({key:e,label:t,type:`boolean`,default:n}),N=(e,t,n,r)=>({key:e,label:t,type:`select`,options:n,default:r}),ne=[{id:`noise`,label:`Noise / Film Grain`,category:`stylize`,params:[j(`amount`,`Amount`,0,1,.01,.3),j(`scale`,`Scale`,.5,20,.1,4),j(`speed`,`Speed`,0,5,.05,1),M(`monochrome`,`Monochrome`,!0)],fragmentShader:k(`
uniform float u_amount;
uniform float u_scale;
uniform bool u_monochrome;
`,`
  vec4 src = texture(u_input, uv);
  vec2 grainUv = uv * u_resolution / u_scale + u_time * 37.0;
  float g = hash21(floor(grainUv));
  vec3 grain = u_monochrome ? vec3(g) : vec3(hash21(floor(grainUv)), hash21(floor(grainUv) + 11.0), hash21(floor(grainUv) + 23.0));
  vec3 result = src.rgb + (grain - 0.5) * u_amount;
  fragColor = vec4(clamp(result, 0.0, 1.0), src.a);
`)},{id:`wave`,label:`Wave / Sine Distortion`,category:`distort`,params:[j(`amplitude`,`Amplitude`,0,.2,.001,.02),j(`frequency`,`Frequency`,.5,40,.1,8),j(`speed`,`Speed`,0,5,.05,1),A(`direction`,`Direction`,0),M(`reactToCursor`,`React to Cursor`,!1)],fragmentShader:k(`
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_direction;
uniform bool u_reactToCursor;
`,`
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
`)},{id:`liquid`,label:`Liquid / Flow Distortion`,category:`distort`,params:[j(`strength`,`Strength`,0,.2,.001,.03),j(`scale`,`Scale`,.5,12,.1,3),j(`speed`,`Speed`,0,5,.05,.6),M(`reactToCursor`,`React to Cursor`,!1)],fragmentShader:k(`
uniform float u_strength;
uniform float u_scale;
uniform bool u_reactToCursor;
`,`
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
`)},{id:`ripple`,label:`Ripple`,category:`distort`,params:[j(`centerX`,`Center X`,0,1,.01,.5),j(`centerY`,`Center Y`,0,1,.01,.5),j(`amplitude`,`Amplitude`,0,.1,.001,.015),j(`frequency`,`Frequency`,1,60,.5,20),j(`decay`,`Decay`,0,5,.05,1.5),M(`reactToCursor`,`Follow Cursor`,!1)],fragmentShader:k(`
uniform float u_centerX;
uniform float u_centerY;
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_decay;
uniform bool u_reactToCursor;
`,`
  vec2 center = u_reactToCursor ? u_mouse : vec2(u_centerX, u_centerY);
  vec2 aspectUv = (uv - center) * vec2(u_resolution.x / u_resolution.y, 1.0);
  float d = length(aspectUv);
  float wave = sin(d * u_frequency - u_time * 4.0) * u_amplitude;
  float falloff = exp(-d * u_decay * 4.0);
  vec2 dir = d > 0.0001 ? aspectUv / d : vec2(0.0);
  vec2 warped = uv + dir * wave * falloff;
  fragColor = texture(u_input, warped);
`)},{id:`chromaticAberration`,label:`Chromatic Aberration`,category:`color`,params:[j(`amount`,`Amount`,0,.05,5e-4,.006),A(`angle`,`Angle`,0),M(`radial`,`Radial`,!0)],fragmentShader:k(`
uniform float u_amount;
uniform float u_angle;
uniform bool u_radial;
`,`
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
`)},{id:`blur`,label:`Blur`,category:`blur`,params:[N(`mode`,`Mode`,[{value:`gaussian`,label:`Gaussian`},{value:`radial`,label:`Radial / Zoom`}],`gaussian`),j(`radius`,`Radius`,0,40,.5,8),j(`centerX`,`Center X`,0,1,.01,.5),j(`centerY`,`Center Y`,0,1,.01,.5)],fragmentShader:k(`
uniform int u_mode;
uniform float u_radius;
uniform float u_centerX;
uniform float u_centerY;
`,`
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
`)},{id:`pixelate`,label:`Pixelate`,category:`stylize`,params:[j(`cellSize`,`Cell Size`,2,100,1,16)],fragmentShader:k(`
uniform float u_cellSize;
`,`
  vec2 cell = u_cellSize / u_resolution;
  vec2 cellUv = (floor(uv / cell) + 0.5) * cell;
  fragColor = texture(u_input, cellUv);
`)},{id:`halftone`,label:`Halftone`,category:`stylize`,params:[j(`dotSize`,`Dot Size`,2,60,1,10),A(`angleDeg`,`Angle`,15),N(`colorMode`,`Color Mode`,[{value:`mono`,label:`Monochrome`},{value:`color`,label:`Color`}],`mono`)],fragmentShader:k(`
uniform float u_dotSize;
uniform float u_angleDeg;
uniform int u_colorMode;
`,`
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
`)},{id:`ascii`,label:`ASCII`,category:`stylize`,params:[j(`cellSize`,`Cell Size`,4,40,1,10),N(`ramp`,`Character Ramp`,[{value:`standard`,label:`Standard`},{value:`blocks`,label:`Blocks`},{value:`binary`,label:`Binary`}],`standard`),N(`colorMode`,`Color Mode`,[{value:`mono`,label:`Monochrome`},{value:`color`,label:`Color`}],`mono`)],fragmentShader:k(`
uniform float u_cellSize;
uniform int u_ramp;
uniform int u_colorMode;
`,`
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
`)},{id:`dither`,label:`Dither`,category:`color`,params:[j(`levels`,`Levels`,2,16,1,4),j(`scale`,`Pattern Scale`,1,8,1,1)],fragmentShader:k(`
uniform float u_levels;
uniform float u_scale;
`,`
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
`)},{id:`bloom`,label:`Bloom / Glow`,category:`blur`,params:[j(`threshold`,`Threshold`,0,1,.01,.7),j(`intensity`,`Intensity`,0,3,.05,1),j(`radius`,`Radius`,1,30,.5,8)],fragmentShader:k(`
uniform float u_threshold;
uniform float u_intensity;
uniform float u_radius;
`,`
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
`)},{id:`displacement`,label:`Displacement Map`,category:`distort`,params:[{key:`map`,label:`Displacement Map`,type:`image`,default:null},j(`strength`,`Strength`,0,.3,.001,.05),j(`scale`,`Scale`,.1,5,.05,1)],fragmentShader:k(`
uniform sampler2D u_map;
uniform bool u_hasMap;
uniform float u_strength;
uniform float u_scale;
`,`
  if (!u_hasMap) {
    fragColor = texture(u_input, uv);
    return;
  }
  vec2 mapUv = fract(uv * u_scale);
  vec2 disp = texture(u_map, mapUv).rg * 2.0 - 1.0;
  vec2 warped = uv + disp * u_strength;
  fragColor = texture(u_input, warped);
`)},{id:`mouseFollow`,label:`Mouse-Follow Distortion`,category:`distort`,needsTrailBuffer:!0,params:[j(`radius`,`Radius`,.02,.6,.01,.18),j(`strength`,`Strength`,0,.4,.005,.08),j(`decay`,`Decay / Trail Length`,.8,.995,.001,.94)],fragmentShader:k(`
uniform sampler2D u_trail;
uniform float u_strength;
`,`
  vec4 trail = texture(u_trail, uv);
  vec2 warped = uv + trail.xy * u_strength * trail.a;
  fragColor = texture(u_input, warped);
`)}],P=new Map(ne.map(e=>[e.id,e]));function F(e){return P.get(e)}var I=`#version 300 es
precision highp float;
uniform sampler2D u_prevTrail;
uniform vec2 u_mouse;
uniform vec2 u_mouseVelocity;
uniform float u_decay;
uniform float u_dt;
uniform float u_radius;
in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 prev = texture(u_prevTrail, v_uv);
  float fade = pow(clamp(u_decay, 0.0, 0.999), max(u_dt, 0.0001) * 60.0);
  vec4 trail = prev * fade;

  float d = distance(v_uv, u_mouse);
  float splat = smoothstep(u_radius, 0.0, d);
  trail.xy = mix(trail.xy, clamp(u_mouseVelocity, -4.0, 4.0), splat);
  trail.a = max(trail.a * fade, splat);
  fragColor = trail;
}
`,L=`#version 300 es
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
`,R=new WeakMap;function z(e){let t=R.get(e);if(!t){t=e.createVertexArray(),e.bindVertexArray(t);let n=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),r=new Float32Array([0,1,1,1,0,0,0,0,1,1,1,0]),i=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,i),e.bufferData(e.ARRAY_BUFFER,n,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let a=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,a),e.bufferData(e.ARRAY_BUFFER,r,e.STATIC_DRAW),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,2,e.FLOAT,!1,0,0),e.bindVertexArray(null),R.set(e,t)}e.bindVertexArray(t)}function B(e){z(e),e.drawArrays(e.TRIANGLES,0,6),e.bindVertexArray(null)}function V(e,t){let n=new Float32Array(9);for(let r=0;r<3;r++)for(let i=0;i<3;i++){let a=0;for(let n=0;n<3;n++)a+=e[n*3+i]*t[r*3+n];n[r*3+i]=a}return n}function H(e,t){return new Float32Array([2/e,0,0,0,-2/t,0,-1,1,1])}function U(e,t){return new Float32Array([1,0,0,0,1,0,e,t,1])}function W(e){let t=Math.cos(e),n=Math.sin(e);return new Float32Array([t,n,0,-n,t,0,0,0,1])}function G(e,t){return new Float32Array([e,0,0,0,t,0,0,0,1])}function K(e){let t=U(e.x,e.y),n=W(e.rotationDeg*Math.PI/180),r=G(e.width*e.scale/2,e.height*e.scale/2);return V(V(t,n),r)}var q=2;function J(e,t,n,r){let i=[];for(let a of t.split(`
`)){let t=a.split(` `),o=``;for(let a of t){let t=o?`${o} ${a}`:a;Y(e,t,r)>n&&o?(i.push(o),o=a):o=t}i.push(o)}return i}function Y(e,t,n){return e.measureText(t).width+Math.max(0,t.length-1)*n}function X(e,t,n,r,i,a){let o=Y(e,t,i),s=n;a===`center`?s=n-o/2:a===`right`&&(s=n-o);let c=e.textAlign;e.textAlign=`left`;for(let n of t)e.fillText(n,s,r),s+=e.measureText(n).width+i;e.textAlign=c}function re(e,t,n,r){if(t.type===`solid`)return t.color;let i=t.gradient;if(i.kind===`radial`){let t=e.createRadialGradient(n/2,r/2,0,n/2,r/2,Math.max(n,r)/2);return i.stops.forEach(e=>t.addColorStop(e.offset,e.color)),t}let a=i.angleDeg*Math.PI/180,o=Math.cos(a),s=Math.sin(a),c=n/2,l=r/2,u=Math.abs(o)*n+Math.abs(s)*r,d=e.createLinearGradient(c-o*u/2,l-s*u/2,c+o*u/2,l+s*u/2);return i.stops.forEach(e=>d.addColorStop(e.offset,e.color)),d}function ie(e){let t=document.createElement(`canvas`),n=Math.max(1,Math.round(e.width*q)),r=Math.max(1,Math.round(e.height*q));t.width=n,t.height=r;let i=t.getContext(`2d`);if(!i)return t;let a=e.fontSize*q;i.font=`${e.fontWeight} ${a}px "${e.fontFamily}", sans-serif`,i.textBaseline=`alphabetic`,i.fillStyle=re(i,e.fill,n,r);let o=e.letterSpacing*q,s=a*e.lineHeight,c=J(i,e.content,n,o),l=c.length*s,u=r/2-l/2+s*.8,d=e.align===`left`?0:e.align===`right`?n:n/2;return c.forEach((t,n)=>{X(i,t,d,u+n*s,o,e.align)}),t}var Z={normal:0,add:1,subtract:2,multiply:3,screen:4,overlay:5,darken:6,lighten:7,colorDodge:8,colorBurn:9,linearBurn:10,hardLight:11,softLight:12,difference:13,exclusion:14,linearLight:15,pinLight:16,vividLight:17},ae={rectangle:0,ellipse:1,plane:2,polygon:3},oe={torus:0,box:1,sphere:2,capsule:3,disc:4,cylinder:5,octahedron:6,hexPrism:7,plus:8,spring:9,tricylinder:10,triangle:11,roundedCross:12,roundedBox:13,mergedDiscs:14,rippledSphere:15,top:16,star:17,pyramid:18,asterisk:19,dodecahedron:20,boxFrame:21,custom:22},se={none:0,xy:1,x:2,y:3,xyz:4,radial:5,radial2:6},ce={none:0,image:1,striped:2,wavy:3,beaded:4,diamond:5,linoleum:6};function le(e){let t=e.background.fill;return y(t.type===`solid`?t.color:t.gradient.stops[0]?.color??`#000000ff`).slice(0,3)}var ue=class{gl;canvas;imageProgram;shapeProgram;gradientProgram;model3dProgram;backgroundProgram;compositeProgram;blitProgram;trailUpdateProgram;effectPrograms=new Map;sceneAccumulator;layerEffectPingPong;backgroundTarget;dryScratch;trailBuffers=new Map;interactiveOffsets=new Map;assetTextures=new Map;assetSignatures=new Map;textCache=new Map;width=1;height=1;constructor(e){this.canvas=e;let t=e.getContext(`webgl2`,{alpha:!0,premultipliedAlpha:!1,antialias:!1});if(!t)throw Error(`WebGL2 is not supported in this browser`);this.gl=t,t.getExtension(`EXT_color_buffer_float`),this.imageProgram=i(t,x,S),this.shapeProgram=i(t,x,w),this.gradientProgram=i(t,x,T),this.model3dProgram=i(t,x,L),this.backgroundProgram=i(t,C,ee),this.compositeProgram=i(t,g,te),this.blitProgram=i(t,g,E),this.trailUpdateProgram=i(t,g,I),this.sceneAccumulator=new u(t,1,1),this.layerEffectPingPong=new u(t,1,1),this.backgroundTarget=s(t,1,1),this.dryScratch=s(t,1,1)}getEffectProgram(e){let t=this.effectPrograms.get(e);if(t)return t;let n=F(e);return n?(t=i(this.gl,g,n.fragmentShader),this.effectPrograms.set(e,t),t):null}resize(e,t){let n=this.gl;if(e=Math.max(1,Math.round(e)),t=Math.max(1,Math.round(t)),!(this.width===e&&this.height===t)){this.width=e,this.height=t,this.canvas.width=e,this.canvas.height=t,this.sceneAccumulator.resize(n,e,t),this.layerEffectPingPong.resize(n,e,t),c(n,this.backgroundTarget,e,t),c(n,this.dryScratch,e,t);for(let r of this.trailBuffers.values())r.resize(n,e,t)}}syncAsset(e,t){let n=`${e.id}:${e.dataUrl.length}`,r=this.assetTextures.get(e.id);r&&this.assetSignatures.get(e.id)===n||(r?h(this.gl,r,t):this.assetTextures.set(e.id,m(this.gl,t)),this.assetSignatures.set(e.id,n))}removeAsset(e){let t=this.assetTextures.get(e);t&&this.gl.deleteTexture(t),this.assetTextures.delete(e),this.assetSignatures.delete(e)}getOrCreateTrailBuffer(e){let t=this.trailBuffers.get(e);return t||(t=new u(this.gl,this.width,this.height),this.trailBuffers.set(e,t)),t}pruneTrailBuffers(e){for(let[t,n]of this.trailBuffers)e.has(t)||(n.dispose(this.gl),this.trailBuffers.delete(t))}drawTextLayerTexture(e){let t=JSON.stringify([e.content,e.fontFamily,e.fontWeight,e.fontSize,e.letterSpacing,e.lineHeight,e.align,e.fill,e.width,e.height]),n=this.textCache.get(e.id);if(n&&n.signature===t)return n.texture;let r=ie(e),i=n?n.texture:m(this.gl,r);return n&&h(this.gl,i,r),this.textCache.set(e.id,{texture:i,signature:t}),i}renderLayerContent(e,t,n,r,i){let s=this.gl;s.bindFramebuffer(s.FRAMEBUFFER,t.framebuffer),s.viewport(0,0,t.width,t.height),s.clearColor(0,0,0,0),s.clear(s.COLOR_BUFFER_BIT),s.disable(s.DEPTH_TEST),s.enable(s.BLEND),s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);let c=H(n.size.width,n.size.height),l=K({x:e.transform.x,y:e.transform.y,width:e.width,height:e.height,rotationDeg:e.transform.rotationDeg,scale:e.transform.scale});if(e.type===`image`){let t=e.assetId?this.assetTextures.get(e.assetId):null;if(!t)return;s.useProgram(this.imageProgram.program),a(s,this.imageProgram,`u_model`,l),a(s,this.imageProgram,`u_projection`,c),s.activeTexture(s.TEXTURE0),s.bindTexture(s.TEXTURE_2D,t),o(s,this.imageProgram,`u_texture`,0),B(s);return}if(e.type===`text`){let t=this.drawTextLayerTexture(e);s.useProgram(this.imageProgram.program),a(s,this.imageProgram,`u_model`,l),a(s,this.imageProgram,`u_projection`,c),s.activeTexture(s.TEXTURE0),s.bindTexture(s.TEXTURE_2D,t),o(s,this.imageProgram,`u_texture`,0),B(s);return}if(e.type===`shape`){s.useProgram(this.shapeProgram.program),a(s,this.shapeProgram,`u_model`,l),a(s,this.shapeProgram,`u_projection`,c),a(s,this.shapeProgram,`u_size`,[e.width,e.height]),a(s,this.shapeProgram,`u_cornerRadius`,e.cornerRadius),a(s,this.shapeProgram,`u_sides`,e.sides),o(s,this.shapeProgram,`u_shapeKind`,ae[e.shape]),v(s,this.shapeProgram,e.fill),B(s);return}if(e.type===`gradient`){s.useProgram(this.gradientProgram.program),a(s,this.gradientProgram,`u_model`,l),a(s,this.gradientProgram,`u_projection`,c),v(s,this.gradientProgram,{type:`gradient`,gradient:e.gradient}),B(s);return}let u=this.model3dProgram;s.useProgram(u.program),a(s,u,`u_model`,l),a(s,u,`u_projection`,c),a(s,u,`u_aspect`,e.width/e.height),a(s,u,`u_fov`,e.fov),a(s,u,`u_canvasResolution`,[this.width,this.height]),a(s,u,`u_rotationDeg`,[e.rotation3d.x,e.rotation3d.y,e.rotation3d.z]),a(s,u,`u_time`,r.time),a(s,u,`u_animSpeed`,e.animationSpeed),a(s,u,`u_animDirection`,[e.animationDirection.x,e.animationDirection.y,e.animationDirection.z]);let d=(r.mouseUv.x-.5)*2.4,f=(r.mouseUv.y-.5)*2.4,p=this.updateInteractiveOffset(e.id,d,f,e.momentum,e.spring,r.dt);a(s,u,`u_interactiveOffset`,[p.x,p.y]),a(s,u,`u_trackMouseAmount`,e.trackMouseAmount),o(s,u,`u_mouseAxes`,e.mouseAxes===`x`?0:e.mouseAxes===`y`?1:2),a(s,u,`u_axisTilt`,e.axisTilt),o(s,u,`u_primitive`,oe[e.primitive]),a(s,u,`u_scale3d`,e.scale3d),a(s,u,`u_twist`,[e.twist.x,e.twist.y]),a(s,u,`u_rounding`,e.rounding),a(s,u,`u_variation`,e.variation),a(s,u,`u_smoothing`,e.smoothing),a(s,u,`u_extrude`,e.extrude),a(s,u,`u_mix`,e.mix),o(s,u,`u_repeatType`,se[e.repeatType]),a(s,u,`u_repeatSpacing`,.3+e.repeatSpacing*5.7),o(s,u,`u_showBackground`,+!!e.showBackground),a(s,u,`u_backgroundColor`,le(n)),a(s,u,`u_refractAmount`,e.refraction.amount),o(s,u,`u_refractBehavior`,+(e.refraction.behavior===`reflect`)),a(s,u,`u_dispersion`,e.refraction.dispersion),a(s,u,`u_refractRoughness`,e.refraction.roughness),s.activeTexture(s.TEXTURE2),s.bindTexture(s.TEXTURE_2D,this.sceneAccumulator.read.texture),o(s,u,`u_sceneTexture`,2),o(s,u,`u_surfaceTextureType`,ce[e.surfaceTexture.type]),a(s,u,`u_surfaceTextureAmount`,e.surfaceTexture.amount),a(s,u,`u_surfaceTextureScale`,.1+e.surfaceTexture.scale*3.9),a(s,u,`u_materialColor`,y(e.material.color).slice(0,3)),a(s,u,`u_roughness`,e.material.roughness),a(s,u,`u_metalness`,e.material.metalness),a(s,u,`u_lightPosition`,[e.light.positionX,e.light.positionY,e.light.positionZ]),a(s,u,`u_specular`,e.light.specular),a(s,u,`u_fresnel`,e.light.fresnel),a(s,u,`u_lightColor`,y(e.light.color).slice(0,3)),a(s,u,`u_opaqueness`,e.light.opaqueness);let m=e.textureAssetId?i(e.textureAssetId):null;o(s,u,`u_hasTexture`,+!!m),m&&(s.activeTexture(s.TEXTURE0),s.bindTexture(s.TEXTURE_2D,m),o(s,u,`u_texture`,0));let h=e.customMapAssetId?i(e.customMapAssetId):null;o(s,u,`u_hasCustomMap`,+!!h),h&&(s.activeTexture(s.TEXTURE1),s.bindTexture(s.TEXTURE_2D,h),o(s,u,`u_customMap`,1)),B(s)}updateInteractiveOffset(e,t,n,r,i,a){let o=this.interactiveOffsets.get(e);o||(o={x:0,y:0,vx:0,vy:0},this.interactiveOffsets.set(e,o));let s=2+i*38,c=8-r*7.5,l=Math.min(a,.05),u=(t-o.x)*s-o.vx*c,d=(n-o.y)*s-o.vy*c;return o.vx+=u*l,o.vy+=d*l,o.x+=o.vx*l,o.y+=o.vy*l,{x:o.x,y:o.y}}applyEffectStack(e,t,n,r){let i=this.gl;for(let s of e){if(!s.enabled)continue;let e=this.getEffectProgram(s.effectId),c=F(s.effectId);if(!e||!c)continue;let l=s.blendMode!==`normal`||s.mix<1;l&&this.copyTexture(t.read.texture,this.dryScratch);let u=null;if(c.needsTrailBuffer){let e=this.getOrCreateTrailBuffer(s.id);i.bindFramebuffer(i.FRAMEBUFFER,e.write.framebuffer),i.viewport(0,0,e.write.width,e.write.height),i.disable(i.BLEND),i.useProgram(this.trailUpdateProgram.program),i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,e.read.texture),o(i,this.trailUpdateProgram,`u_prevTrail`,0),a(i,this.trailUpdateProgram,`u_mouse`,[n.mouseUv.x,n.mouseUv.y]),a(i,this.trailUpdateProgram,`u_mouseVelocity`,[n.mouseVelocity.x,n.mouseVelocity.y]),a(i,this.trailUpdateProgram,`u_decay`,Number(s.params.decay??.94)),a(i,this.trailUpdateProgram,`u_dt`,n.dt),a(i,this.trailUpdateProgram,`u_radius`,Number(s.params.radius??.18)),p(i),e.swap(),u=e.read.texture}i.bindFramebuffer(i.FRAMEBUFFER,t.write.framebuffer),i.viewport(0,0,t.write.width,t.write.height),i.disable(i.BLEND),i.useProgram(e.program),i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,t.read.texture),o(i,e,`u_input`,0),a(i,e,`u_resolution`,[t.write.width,t.write.height]),a(i,e,`u_time`,n.time*s.speed),a(i,e,`u_mouse`,[n.mouseUv.x,n.mouseUv.y]),a(i,e,`u_mouseVelocity`,[n.mouseVelocity.x,n.mouseVelocity.y]);let d=1;for(let t of c.params){let n=s.params[t.key],c=`u_${t.key}`;if(t.type===`boolean`)o(i,e,c,+!!n);else if(t.type===`select`){let r=t.options.findIndex(e=>e.value===n);o(i,e,c,Math.max(0,r))}else if(t.type!==`color`)if(t.type===`image`){let t=typeof n==`string`?n:null,a=t?r(t):null;o(i,e,`u_hasMap`,+!!a),a&&(i.activeTexture(i.TEXTURE0+d),i.bindTexture(i.TEXTURE_2D,a),o(i,e,c,d),d++)}else a(i,e,c,Number(n))}u&&(i.activeTexture(i.TEXTURE0+d),i.bindTexture(i.TEXTURE_2D,u),o(i,e,`u_trail`,d),d++),p(i),t.swap(),l&&(i.bindFramebuffer(i.FRAMEBUFFER,t.write.framebuffer),i.viewport(0,0,t.write.width,t.write.height),i.disable(i.BLEND),i.useProgram(this.compositeProgram.program),i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,this.dryScratch.texture),o(i,this.compositeProgram,`u_dst`,0),i.activeTexture(i.TEXTURE1),i.bindTexture(i.TEXTURE_2D,t.read.texture),o(i,this.compositeProgram,`u_src`,1),o(i,this.compositeProgram,`u_mode`,Z[s.blendMode]),a(i,this.compositeProgram,`u_opacity`,s.mix),p(i),t.swap())}}compositeOnto(e,t,n,r){let i=this.gl;i.bindFramebuffer(i.FRAMEBUFFER,e.write.framebuffer),i.viewport(0,0,e.write.width,e.write.height),i.disable(i.BLEND),i.useProgram(this.compositeProgram.program),i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,e.read.texture),o(i,this.compositeProgram,`u_dst`,0),i.activeTexture(i.TEXTURE1),i.bindTexture(i.TEXTURE_2D,t),o(i,this.compositeProgram,`u_src`,1),o(i,this.compositeProgram,`u_mode`,Z[n]),a(i,this.compositeProgram,`u_opacity`,r),p(i),e.swap()}copyTexture(e,t){let n=this.gl;n.bindFramebuffer(n.FRAMEBUFFER,t.framebuffer),n.viewport(0,0,t.width,t.height),n.disable(n.BLEND),n.useProgram(this.blitProgram.program),n.activeTexture(n.TEXTURE0),n.bindTexture(n.TEXTURE_2D,e),o(n,this.blitProgram,`u_input`,0),p(n)}applyEffectLayer(e,t,n){let r={id:e.id,effectId:e.effectId,enabled:!0,speed:e.speed,blendMode:e.blendMode,mix:e.opacity,params:e.params};this.applyEffectStack([r],this.sceneAccumulator,t,n)}render(e,t){let n=this.gl,r=Math.max(1,Math.round(e.size.width*t.renderScale)),i=Math.max(1,Math.round(e.size.height*t.renderScale));this.resize(r,i);let a=e=>this.assetTextures.get(e)??null;n.bindFramebuffer(n.FRAMEBUFFER,this.sceneAccumulator.read.framebuffer),n.viewport(0,0,r,i),n.disable(n.BLEND),n.useProgram(this.backgroundProgram.program),v(n,this.backgroundProgram,e.background.fill),p(n);for(let n of e.layers)if(n.visible){if(n.type===`effect`){this.applyEffectLayer(n,t,a);continue}this.renderLayerContent(n,this.layerEffectPingPong.write,e,t,a),this.layerEffectPingPong.swap(),this.applyEffectStack(n.effects,this.layerEffectPingPong,t,a),this.compositeOnto(this.sceneAccumulator,this.layerEffectPingPong.read.texture,n.blendMode,n.opacity)}this.applyEffectStack(e.effects,this.sceneAccumulator,t,a),n.bindFramebuffer(n.FRAMEBUFFER,null),n.viewport(0,0,this.canvas.width,this.canvas.height),n.disable(n.BLEND),n.useProgram(this.blitProgram.program),n.activeTexture(n.TEXTURE0),n.bindTexture(n.TEXTURE_2D,this.sceneAccumulator.read.texture),o(n,this.blitProgram,`u_input`,0),p(n)}dispose(){let e=this.gl;this.sceneAccumulator.dispose(e),this.layerEffectPingPong.dispose(e),l(e,this.dryScratch);for(let t of this.trailBuffers.values())t.dispose(e);for(let t of this.assetTextures.values())e.deleteTexture(t);for(let t of this.textCache.values())e.deleteTexture(t.texture)}};function Q(e,n){let r=document.createElement(`canvas`);r.style.width=`100%`,r.style.height=`100%`,r.style.display=`block`,e.style.position||=`relative`,e.appendChild(r);let i=new ue(r),a=!1;for(let e of n.assets){let t=new Image;t.onload=()=>{a||i.syncAsset(e,t)},t.src=e.dataUrl}let o={x:.5,y:.5},s={x:0,y:0},c=null;function l(e){let t=r.getBoundingClientRect(),n=Math.min(1,Math.max(0,(e.clientX-t.left)/t.width)),i=1-Math.min(1,Math.max(0,(e.clientY-t.top)/t.height)),a=performance.now();if(c!=null){let e=Math.max(.001,(a-c)/1e3);s.x=(n-o.x)/e,s.y=(i-o.y)/e}c=a,o.x=n,o.y=i}e.addEventListener(`pointermove`,l);let u=0,d=null,f=null,p=Math.min(2,window.devicePixelRatio||1);function m(e){f=requestAnimationFrame(m);let r=d==null?16:e-d;d=e;let a=Math.min(.1,Math.max(0,r/1e3));t(n)&&(u+=a*n.animationSpeed,i.render(n,{time:u,dt:a,mouseUv:o,mouseVelocity:s,renderScale:p}),s.x*=.85,s.y*=.85)}return i.render(n,{time:0,dt:0,mouseUv:o,mouseVelocity:s,renderScale:p}),f=requestAnimationFrame(m),function(){a=!0,f!=null&&cancelAnimationFrame(f),e.removeEventListener(`pointermove`,l),i.dispose(),e.removeChild(r)}}function $(){document.querySelectorAll(`[data-scene]`).forEach(e=>{if(e.dataset.shaderfieldMounted===`true`)return;let t=e.dataset.scene?.trim()?e.dataset.scene:e.textContent;if(t)try{let n=JSON.parse(t);e.textContent=``,Q(e,n),e.dataset.shaderfieldMounted=`true`}catch(e){console.error(`[shaderfield] failed to mount scene`,e)}})}document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,$):$()})();