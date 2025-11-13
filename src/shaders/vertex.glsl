#version 300 es
precision mediump float;


in vec3 vertexPosition;
in vec3 vertexColor;

uniform vec3 originPosition;
uniform mat4 modelMatrix;

out vec3 fragmentColor;

void main() {
  gl_Position = modelMatrix * vec4(vertexPosition + originPosition, 1.0);
  fragmentColor = vertexColor;
}

