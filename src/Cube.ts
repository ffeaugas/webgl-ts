import vertexShaderSource from "./shaders/vertex.glsl?raw";
import fragmentShaderSource from "./shaders/fragment.glsl?raw";
import { createShader } from "./utils";
import { mat4, type mat4 as Mat4, type vec3 as Vec3 } from "gl-matrix";

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

export class Cube {
  private position: Vec3;
  private cubeVertices: Float32Array;
  private colors: Uint8Array;
  private modelMatrix: Mat4 = mat4.create();
  private gl: WebGLRenderingContext;
  private positionBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private positionAttributeLocation: number | null = null;
  private colorAttributeLocation: number | null = null;
  private vertexShader: WebGLShader | null = null;
  private fragmentShader: WebGLShader | null = null;
  private shaderProgram: WebGLProgram | null = null;
  private modelMatrixLocation: WebGLUniformLocation | null = null;

  constructor(gl: WebGLRenderingContext, position: Vec3) {
    this.gl = gl;
    this.position = position;
    this.cubeVertices = cubeVertices;
    this.colors = cubeColors;
    this.initShaders();
    this.initBuffers();
  }

  private initShaders() {
    this.vertexShader = createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
    this.fragmentShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    this.shaderProgram = this.gl.createProgram()!;
    this.gl.attachShader(this.shaderProgram, this.vertexShader);
    this.gl.attachShader(this.shaderProgram, this.fragmentShader);
    this.gl.linkProgram(this.shaderProgram);

    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(this.shaderProgram);
      this.gl.deleteProgram(this.shaderProgram);
      throw new Error(`Erreur de liaison du programme: ${info}`);
    }

    this.modelMatrixLocation = this.gl.getUniformLocation(this.shaderProgram, "modelMatrix");
  }

  private initBuffers() {
    this.positionBuffer = this.gl.createBuffer();
    if (!this.positionBuffer) {
      throw new Error("Failed to create position buffer");
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.cubeVertices, this.gl.STATIC_DRAW);

    this.colorBuffer = this.gl.createBuffer();
    if (!this.colorBuffer) {
      throw new Error("Failed to create color buffer");
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.colors, this.gl.STATIC_DRAW);

    this.positionAttributeLocation = this.gl.getAttribLocation(
      this.shaderProgram!,
      "vertexPosition"
    );
    if (this.positionAttributeLocation < 0) {
      throw new Error("Failed to get position attribute location");
    }
    this.gl.enableVertexAttribArray(this.positionAttributeLocation);
    this.gl.vertexAttribPointer(this.positionAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.colorAttributeLocation = this.gl.getAttribLocation(this.shaderProgram!, "vertexColor");
    if (this.colorAttributeLocation < 0) {
      throw new Error("Failed to get color attribute location");
    }
    this.gl.enableVertexAttribArray(this.colorAttributeLocation);
    this.gl.vertexAttribPointer(this.colorAttributeLocation, 3, this.gl.UNSIGNED_BYTE, true, 0, 0);
  }

  public draw() {
    mat4.identity(this.modelMatrix);
    mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
    mat4.rotate(this.modelMatrix, this.modelMatrix, Math.PI / 4, [0, 1, 0]);

    this.gl.useProgram(this.shaderProgram);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(this.positionAttributeLocation!, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.vertexAttribPointer(this.colorAttributeLocation!, 3, this.gl.UNSIGNED_BYTE, true, 0, 0);
    this.gl.uniformMatrix4fv(this.modelMatrixLocation!, false, this.modelMatrix);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 36);
  }
}
