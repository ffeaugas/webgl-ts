let lastTime = performance.now();
let frames = 0;
let fps = 0;

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

export function safeCreateBuffer(
  gl: WebGLRenderingContext,
  data: Float32Array | Uint8Array
): WebGLBuffer {
  const buffer = gl.createBuffer();
  if (!buffer) {
    throw new Error("Failed to create buffer");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  return buffer;
}

export function updateFPS() {
  frames++;
  const currentTime = performance.now();

  if (currentTime >= lastTime + 1000) {
    fps = Math.round((frames * 1000) / (currentTime - lastTime));
    frames = 0;
    lastTime = currentTime;

    const fpsElement = document.getElementById("fps");
    if (fpsElement) {
      fpsElement.textContent = `FPS: ${fps}`;
    }
  }
}

export function initShaders(
  gl: WebGLRenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string
): WebGLProgram {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  const program = gl.createProgram();
  if (!program) {
    throw new Error("Failed to create shader program");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Shader linking failed: ${info}`);
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}
