import vertexShaderSource from "./shaders/vertex.glsl?raw";
import fragmentShaderSource from "./shaders/fragment.glsl?raw";
import { createShader, getAttribLocation, getUniformLocation } from "./utils";
import { mat4, type mat4 as Mat4, type vec3 as Vec3 } from "gl-matrix";
import type { Drawable } from "./Drawable";

const CUBE_SIZE = 0.2;

// prettier-ignore
const CUBE_VERTICES = new Float32Array([
  -CUBE_SIZE, -CUBE_SIZE,  CUBE_SIZE,  // 0: front-bottom-left
   CUBE_SIZE, -CUBE_SIZE,  CUBE_SIZE,  // 1: front-bottom-right
   CUBE_SIZE,  CUBE_SIZE,  CUBE_SIZE,  // 2: front-top-right
  -CUBE_SIZE,  CUBE_SIZE,  CUBE_SIZE,  // 3: front-top-left
  -CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE,  // 4: back-bottom-left
   CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE,  // 5: back-bottom-right
   CUBE_SIZE,  CUBE_SIZE, -CUBE_SIZE,  // 6: back-top-right
  -CUBE_SIZE,  CUBE_SIZE, -CUBE_SIZE,  // 7: back-top-left
]);

// prettier-ignore
const CUBE_COLORS = new Uint8Array([
  255,   0,   0,
  255, 255,   0,
    0, 255,   0,
    0,   0, 255,
  255,   0, 255,
  255, 128,   0,
    0, 255, 255,
  128, 128, 128,
]);

const CUBE_INDICES = new Uint16Array([
  // Front face
  0, 1, 2, 2, 3, 0,
  // Back face
  4, 7, 6, 6, 5, 4,
  // Left face
  4, 0, 3, 3, 7, 4,
  // Right face
  1, 5, 6, 6, 2, 1,
  // Top face
  3, 2, 6, 6, 7, 3,
  // Bottom face
  4, 5, 1, 1, 0, 4,
]);

export class Cube implements Drawable {
  readonly position: Vec3;
  private readonly gl: WebGL2RenderingContext;
  private readonly modelMatrix: Mat4 = mat4.create();

  // WebGL2 resources
  private readonly vao: WebGLVertexArrayObject;
  private readonly positionBuffer: WebGLBuffer;
  private readonly colorBuffer: WebGLBuffer;
  private readonly indexBuffer: WebGLBuffer;
  private readonly shaderProgram: WebGLProgram;

  // Shader locations
  private readonly attribLocations: {
    position: number;
    color: number;
  };
  private readonly uniformLocations: {
    modelMatrix: WebGLUniformLocation;
  };

  constructor(gl: WebGL2RenderingContext, position: Vec3) {
    this.gl = gl;
    this.position = position;

    this.shaderProgram = this.initShaders();

    this.attribLocations = {
      position: getAttribLocation(this.gl, this.shaderProgram, "vertexPosition"),
      color: getAttribLocation(this.gl, this.shaderProgram, "vertexColor"),
    };

    this.uniformLocations = {
      modelMatrix: getUniformLocation(this.gl, this.shaderProgram, "modelMatrix"),
    };

    this.positionBuffer = this.createBuffer(CUBE_VERTICES);
    this.colorBuffer = this.createBuffer(CUBE_COLORS);
    this.indexBuffer = this.createIndexBuffer(CUBE_INDICES);

    const vao = this.gl.createVertexArray();
    if (!vao) {
      throw new Error("Failed to create VAO");
    }
    this.vao = vao;

    this.setupVertexAttributeObject();
  }

  private initShaders(): WebGLProgram {
    const vertexShader = createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = this.gl.createProgram();
    if (!program) {
      throw new Error("Failed to create shader program");
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(`Shader linking failed: ${info}`);
    }

    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    return program;
  }

  private createBuffer(data: Float32Array | Uint8Array): WebGLBuffer {
    const buffer = this.gl.createBuffer();
    if (!buffer) {
      throw new Error("Failed to create buffer");
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

    return buffer;
  }

  private createIndexBuffer(data: Uint16Array): WebGLBuffer {
    const buffer = this.gl.createBuffer();
    if (!buffer) {
      throw new Error("Failed to create index buffer");
    }

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

    return buffer;
  }

  private setupVertexAttributeObject(): void {
    this.gl.bindVertexArray(this.vao);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.enableVertexAttribArray(this.attribLocations.position);
    this.gl.vertexAttribPointer(this.attribLocations.position, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.enableVertexAttribArray(this.attribLocations.color);
    this.gl.vertexAttribPointer(this.attribLocations.color, 3, this.gl.UNSIGNED_BYTE, true, 0, 0);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bindVertexArray(null);
  }

  private updateModelMatrix(): void {
    mat4.identity(this.modelMatrix);
    mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
    mat4.rotate(this.modelMatrix, this.modelMatrix, Math.PI / 4, [0, 1, 0]);
  }

  public draw(): void {
    this.updateModelMatrix();

    this.gl.useProgram(this.shaderProgram);

    // Bind le VAO (restaure buffers + attributs + index buffer)
    this.gl.bindVertexArray(this.vao);

    // Upload la matrice model
    this.gl.uniformMatrix4fv(this.uniformLocations.modelMatrix, false, this.modelMatrix);

    // 36 indices (12 triangles × 3 indices), mais seulement 8 vertices uniques
    this.gl.drawElements(this.gl.TRIANGLES, CUBE_INDICES.length, this.gl.UNSIGNED_SHORT, 0);

    // Unbind (bonne pratique)
    this.gl.bindVertexArray(null);
  }

  /**
   * Libère les ressources WebGL
   */
  public dispose(): void {
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteBuffer(this.positionBuffer);
    this.gl.deleteBuffer(this.colorBuffer);
    this.gl.deleteBuffer(this.indexBuffer);
    this.gl.deleteProgram(this.shaderProgram);
  }
}
