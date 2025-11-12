import "./style.css";
import vertexShaderSource from "./shaders/vertex.glsl?raw";
import fragmentShaderSource from "./shaders/fragment.glsl?raw";

// Récupération du canvas et configuration
const canvas = document.querySelector<HTMLCanvasElement>("#webgl-container")!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Obtention du contexte WebGL
const gl = canvas.getContext("webgl2")!;

if (!gl) {
  throw new Error("WebGL n'est pas supporté par votre navigateur");
}

// Configuration de la couleur de fond
gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clear(gl.COLOR_BUFFER_BIT);

// ============================================
// ÉTAPE 1: Création des shaders : compilation du shader
// ============================================

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
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

// Compilation des shaders
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(
  gl,
  gl.FRAGMENT_SHADER,
  fragmentShaderSource
);

// ============================================
// ÉTAPE 2: Création du programme WebGL
// ============================================

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram {
  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Erreur de liaison du programme: ${info}`);
  }

  return program;
}

const program = createProgram(gl, vertexShader, fragmentShader);
gl.useProgram(program);

// prettier-ignore
const cubeVertices = new Float32Array([
  // Front face 
  -0.2, -0.2, 0.2, 
  0.2, -0.2, 0.2,
  0.2, 0.2, 0.2,
  0.2, 0.2, 0.2,
  -0.2, 0.2, 0.2,
  -0.2, -0.2, 0.2,

  // Back face
  -0.2, -0.2, -0.2,
  -0.2, 0.2, -0.2,
  0.2, 0.2, -0.2,
  0.2, 0.2, -0.2,
  0.2, -0.2, -0.2,
  -0.2, -0.2, -0.2,

  // Left face
  -0.2, -0.2, -0.2,
  -0.2, -0.2, 0.2,
  -0.2, 0.2, 0.2,
  -0.2, 0.2, 0.2,
  -0.2, 0.2, -0.2,
  -0.2, -0.2, -0.2,

  // Right face
  0.2, -0.2, -0.2,
  0.2, 0.2, -0.2,
  0.2, 0.2, 0.2,
  0.2, 0.2, 0.2,
  0.2, -0.2, 0.2,
  0.2, -0.2, -0.2,

  // Top face
  -0.2, 0.2, -0.2,
  -0.2, 0.2, 0.2,
  0.2, 0.2, 0.2,
  0.2, 0.2, 0.2,
  0.2, 0.2, -0.2,
  -0.2, 0.2, -0.2,

  // Bottom face
  -0.2, -0.2, -0.2,
  0.2, -0.2, -0.2,
  0.2, -0.2, 0.2,
  0.2, -0.2, 0.2,
  -0.2, -0.2, 0.2,
  -0.2, -0.2, -0.2,
]);

// Second cube vertices (offset to the right)
// prettier-ignore
const cube2Vertices = new Float32Array([
  // Front face 
  0.5, -0.5, 0.5, 
  1.5, -0.5, 0.5,
  1.5, 0.5, 0.5,
  1.5, 0.5, 0.5,
  0.5, 0.5, 0.5,
  0.5, -0.5, 0.5,

  // Back face
  0.5, -0.5, -0.5,
  0.5, 0.5, -0.5,
  1.5, 0.5, -0.5,
  1.5, 0.5, -0.5,
  1.5, -0.5, -0.5,
  0.5, -0.5, -0.5,

  // Left face
  0.5, -0.5, -0.5,
  0.5, -0.5, 0.5,
  0.5, 0.5, 0.5,
  0.5, 0.5, 0.5,
  0.5, 0.5, -0.5,
  0.5, -0.5, -0.5,

  // Right face
  1.5, -0.5, -0.5,
  1.5, 0.5, -0.5,
  1.5, 0.5, 0.5,
  1.5, 0.5, 0.5,
  1.5, -0.5, 0.5,
  1.5, -0.5, -0.5,

  // Top face
  0.5, 0.5, -0.5,
  0.5, 0.5, 0.5,
  1.5, 0.5, 0.5,
  1.5, 0.5, 0.5,
  1.5, 0.5, -0.5,
  0.5, 0.5, -0.5,

  // Bottom face
  0.5, -0.5, -0.5,
  1.5, -0.5, -0.5,
  1.5, -0.5, 0.5,
  1.5, -0.5, 0.5,
  0.5, -0.5, 0.5,
  0.5, -0.5, -0.5,
]);

// prettier-ignore
const cubeColors = new Uint8Array([
  // Front face (red) - 6 vertices
  255, 0, 0,
  255, 0, 0,
  255, 0, 0,
  255, 0, 0,
  255, 0, 0,
  255, 0, 0,

  // Back face (green) - 6 vertices
  0, 255, 0,
  0, 255, 0,
  0, 255, 0,
  0, 255, 0,
  0, 255, 0,
  0, 255, 0,

  // Left face (blue) - 6 vertices
  0, 0, 255,
  0, 0, 255,
  0, 0, 255,
  0, 0, 255,
  0, 0, 255,
  0, 0, 255,

  // Right face (red) - 6 vertices
  255, 0, 0,
  255, 0, 0,
  255, 0, 0,
  255, 0, 0,
  255, 0, 0,
  255, 0, 0,

  // Top face (green) - 6 vertices
  0, 255, 0,
  0, 255, 0,
  0, 255, 0,
  0, 255, 0,
  0, 255, 0,
  0, 255, 0,

  // Bottom face (blue) - 6 vertices
  0, 0, 255,
  0, 0, 255,
  0, 0, 255,
  0, 0, 255,
  0, 0, 255,
  0, 0, 255,
]);

// ============================================
// ÉTAPE 4: Création et remplissage du buffer
// ============================================
const positionBuffer = gl.createBuffer();
if (!positionBuffer) {
  throw new Error("Impossible de créer le buffer WebGL");
}
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

const positionBuffer2 = gl.createBuffer();
if (!positionBuffer2) {
  throw new Error("Impossible de créer le buffer WebGL");
}
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2);
gl.bufferData(gl.ARRAY_BUFFER, cube2Vertices, gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer();
if (!colorBuffer) {
  throw new Error("Impossible de créer le buffer WebGL");
}
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);
// ============================================
// ÉTAPE 5: Attributs et uniforms
// ============================================

// Récupération de l'emplacement de l'attribut a_position dans le shader
const vertexPositionAttributeLocation = gl.getAttribLocation(
  program,
  "vertexPosition"
);
const vertexColorAttributeLocation = gl.getAttribLocation(
  program,
  "vertexColor"
);
if (vertexPositionAttributeLocation < 0 || vertexColorAttributeLocation < 0) {
  throw new Error("Attribute vertexPosition or vertexColor not found");
}

gl.enableVertexAttribArray(vertexPositionAttributeLocation);
gl.enableVertexAttribArray(vertexColorAttributeLocation);
const originUniformLocation = gl.getUniformLocation(program, "origin");
if (!originUniformLocation) {
  throw new Error("Uniform origin not found");
}

// Animation
function animate() {
  requestAnimationFrame(animate);

  // Effacement
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Render first cube
  gl.uniform3f(originUniformLocation, 0.0, 0.0, 0.0);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(
    vertexPositionAttributeLocation,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(
    vertexColorAttributeLocation,
    3,
    gl.UNSIGNED_BYTE,
    true,
    0,
    0
  );
  gl.drawArrays(gl.TRIANGLES, 0, 36);

  // Render second cube (same colors, different vertices)
  gl.uniform3f(originUniformLocation, 0.0, 0.0, 0.0);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2);
  gl.vertexAttribPointer(
    vertexPositionAttributeLocation,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(
    vertexColorAttributeLocation,
    3,
    gl.UNSIGNED_BYTE,
    true,
    0,
    0
  );
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

animate();
