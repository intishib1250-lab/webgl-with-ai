/** Feedback pass for the mouse-follow effect's persistent trail buffer (rg = flow dir, a = strength). */
export const TRAIL_UPDATE_FRAGMENT_SHADER = `#version 300 es
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
`;
