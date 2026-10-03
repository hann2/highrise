// The floor near walls and doors, darkened by the contact shadows texture
// (see ContactShadows): each vertex is in the world, and `uWorldToShadows`
// finds where it is in the texture, which covers the screen.
in vec2 aPosition;
// Where the vertex is in the world, the same as `aPosition` (a mesh's
// geometry has to have texture coordinates, and Pixi warns about unused ones)
in vec2 aUV;

out vec2 vUV;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
uniform mat3 uWorldToShadows;

void main(void) {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vUV = (uWorldToShadows * vec3(aUV, 1.0)).xy;
}
