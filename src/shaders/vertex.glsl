#version 300 es
precision mediump float;


in vec3 vertexPosition;
in vec3 vertexColor;
in vec2 vertexTexture;

uniform mat4 modelMatrix;
uniform mat4 projectionViewMatrix;

out vec3 fragmentColor;
out vec2 fragmentTextureCoord;

void main() {
  gl_Position = projectionViewMatrix * modelMatrix * vec4(vertexPosition, 1.0);
  fragmentColor = vertexColor;
  fragmentTextureCoord = vertexTexture;
}

