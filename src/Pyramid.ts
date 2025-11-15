import vertexShaderSource from "./shaders/vertex.glsl?raw";
import fragmentShaderSource from "./shaders/fragment.glsl?raw";
import { safeCreateBuffer, createShader, getAttribLocation, getUniformLocation } from "./utils";
import { mat4, type mat4 as Mat4, type vec3 as Vec3 } from "gl-matrix";
import type { Drawable } from "./Drawable";

const PYRAMID_SIZE = 0.2;

// prettier-ignore
const PYRAMID_VERTICES = new Float32Array([
  // Base
  -PYRAMID_SIZE, -PYRAMID_SIZE,  PYRAMID_SIZE,   // 0: front-left
   PYRAMID_SIZE, -PYRAMID_SIZE,  PYRAMID_SIZE,   // 1: front-right
   PYRAMID_SIZE, -PYRAMID_SIZE, -PYRAMID_SIZE,   // 2: back-right
  -PYRAMID_SIZE, -PYRAMID_SIZE, -PYRAMID_SIZE,   // 3: back-left
  // Apex
   0, PYRAMID_SIZE, 0,                          // 4: top/apex
]);

// prettier-ignore
const PYRAMID_COLORS = new Uint8Array([
  255,   0,   0,    // base front-left
  255,   0,   0,    // base front-right
  255,   0,   0,    // base back-right
  255,   0,   0,    // base back-left
  0,   255,   0,    // apex
]);

// prettier-ignore
const PYRAMID_INDICES = new Uint16Array([
  // Base (two triangles)
  0, 1, 2,
  0, 2, 3,
  // Sides
  0, 1, 4,  // front face
  1, 2, 4,  // right face
  2, 3, 4,  // back face
  3, 0, 4,   // left face
]);

export class Pyramid implements Drawable {
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

    this.positionBuffer = safeCreateBuffer(this.gl, PYRAMID_VERTICES);
    this.colorBuffer = safeCreateBuffer(this.gl, PYRAMID_COLORS);
    this.indexBuffer = this.createIndexBuffer(PYRAMID_INDICES);

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
    mat4.rotate(this.modelMatrix, this.modelMatrix, Math.PI / 4, [0, 1, 1]);
  }

  public draw(): void {
    this.updateModelMatrix();

    this.gl.useProgram(this.shaderProgram);
    this.gl.bindVertexArray(this.vao);
    this.gl.uniformMatrix4fv(this.uniformLocations.modelMatrix, false, this.modelMatrix);

    // circular light motion
    const radius = 0.5;
    const speed = 0.001; // radians per frame
    const angle = performance.now() * speed;

    this.position[0] = Math.cos(angle) * radius;
    // this.position[2] = Math.sin(angle) * radius;

    this.gl.drawElements(this.gl.TRIANGLES, PYRAMID_INDICES.length, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
  }

  public dispose(): void {
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteBuffer(this.positionBuffer);
    this.gl.deleteBuffer(this.colorBuffer);
    this.gl.deleteBuffer(this.indexBuffer);
    this.gl.deleteProgram(this.shaderProgram);
  }
}
