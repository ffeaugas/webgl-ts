#version 300 es
precision mediump float;


in vec3 vertexPosition;
in vec3 vertexColor;

uniform mat4 modelMatrix;
uniform mat4 projectionViewMatrix;

out vec3 fragmentColor;

void main() {
  gl_Position = projectionViewMatrix * modelMatrix * vec4(vertexPosition, 1.0);
  fragmentColor = vertexColor;
}

