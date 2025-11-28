#version 300 es
precision mediump float;


in vec3 vertexPosition;
in vec3 vertexColor;
in vec2 vertexTexture;
in vec3 vertexNormal;

uniform mat4 modelMatrix;
uniform mat4 projectionViewMatrix;
uniform mat3 normalMatrix;
uniform vec3 lightDirection;

out vec3 fragmentColor;
out vec2 fragmentTextureCoord;
out float brightness;

void main() {
  gl_Position = projectionViewMatrix * modelMatrix * vec4(vertexPosition, 1.0);
  fragmentColor = vertexColor;
  fragmentTextureCoord = vertexTexture;
  
  vec3 worldNormal = normalize(normalMatrix * vertexNormal);
  vec3 normalizedLightDir = normalize(lightDirection);
  brightness = max(dot(worldNormal, normalizedLightDir), 0.0);
}

