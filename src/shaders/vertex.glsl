#version 300 es
precision mediump float;

in vec3 vertexPosition;
in vec3 vertexColor;

uniform vec3 origin;

out vec3 fragmentColor;

void main() {
  gl_Position = vec4(vertexPosition + origin, 1.0);
  fragmentColor = vertexColor;
}

