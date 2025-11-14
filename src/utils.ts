export function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Erreur de compilation du shader: ${info}`);
  }

  return shader;
}

export function getUniformLocation(
  gl: WebGLRenderingContext,
  shaderProgram: WebGLProgram,
  name: string
): WebGLUniformLocation {
  const location = gl.getUniformLocation(shaderProgram, name);
  if (!location) {
    throw new Error(`Uniform '${name}' not found in shader`);
  }
  return location;
}

export function getAttribLocation(
  gl: WebGLRenderingContext,
  shaderProgram: WebGLProgram,
  name: string
): number {
  const location = gl.getAttribLocation(shaderProgram, name);
  if (location < 0) {
    throw new Error(`Attribute '${name}' not found in shader`);
  }
  return location;
}
