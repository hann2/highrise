in vec2 vUV;
out vec4 finalColor;

uniform sampler2D uShadows;

void main(void) {
  // Multiplied over the floor: white leaves it as it is
  float shade = texture(uShadows, vUV).r;
  finalColor = vec4(shade, shade, shade, 1.0);
}
