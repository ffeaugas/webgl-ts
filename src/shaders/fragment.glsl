#version 300 es
precision mediump float;

out vec4 outColor;

in vec3 fragmentColor;
in vec2 fragmentTextureCoord;
in float brightness;

uniform sampler2D textureSampler;
uniform int useTexture;

void main() {
  if (useTexture == 1) {
    vec4 textureColor = texture(textureSampler, fragmentTextureCoord);
    outColor = textureColor * 0.1 + textureColor * brightness * 0.9;
  } else {
    outColor = vec4(fragmentColor, 1.0) * 0.1 + vec4(fragmentColor, 1.0) * brightness * 0.9;
    outColor.a = 1.0;
  }
}

