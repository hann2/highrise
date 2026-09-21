in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform highp vec4 uInputSize;
uniform highp vec4 uOutputFrame;

uniform float uHealthPercent;

void main(void) {
  vec3 grayMagic = vec3(0.2126, 0.7152, 0.0722);

  vec4 originalColor = texture(uTexture, vTextureCoord);
  vec3 color = originalColor.rgb;

  float luminence = dot(originalColor.rgb, grayMagic);
  vec3 faded = vec3(luminence, luminence, luminence) * 0.85;

  float amount = 1.0 - 1.5 * uHealthPercent;
  vec2 uv = vTextureCoord.xy * uInputSize.xy / uOutputFrame.zw;
  amount *= distance(uv, vec2(0.5, 0.5)) * 2.0 + 1.0;
  amount = clamp(amount, 0.0, 1.0);

  // desaturate
  color = mix(color, faded, amount);

  // Apply contrast
  color = ((color.rgb - 0.5) * (1.0 + amount * 0.15)) + 0.5;

  finalColor = vec4(color, originalColor.a);
}
