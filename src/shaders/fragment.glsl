#version 300 es
precision mediump float;

out vec4 outColor;

in vec3 fragmentColor;
in vec2 fragmentTextureCoord;

uniform sampler2D textureSampler;
uniform int useTexture;

void main() {
  if (useTexture == 1) {
    vec4 textureColor = texture(textureSampler, fragmentTextureCoord);
    outColor = textureColor;
  } else {
    outColor = vec4(fragmentColor, 1.0);
  }
}

