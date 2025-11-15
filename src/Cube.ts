import vertexShaderSource from "./shaders/vertex.glsl?raw";
import fragmentShaderSource from "./shaders/fragment.glsl?raw";
import { safeCreateBuffer, createShader, getAttribLocation, getUniformLocation } from "./utils";
import { glMatrix, mat4, type mat4 as Mat4, type vec3 as Vec3 } from "gl-matrix";
import type { Drawable } from "./Drawable";

// prettier-ignore
const CUBE_VERTICES = new Float32Array([
  // Front face
  -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
  // Back face
  -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
  // Top face
  -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
  // Bottom face
  -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
  // Right face
  1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
  // Left face
  -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
]);

// prettier-ignore
const faceColors = [
  [1.0, 1.0, 1.0, 1.0], // Front face: white
  [1.0, 0.0, 0.0, 1.0], // Back face: red
  [0.0, 1.0, 0.0, 1.0], // Top face: green
  [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
  [1.0, 1.0, 0.0, 1.0], // Right face: yellow
  [1.0, 0.0, 1.0, 1.0], // Left face: purple
];

// Convert the array of colors into a table for all the vertices.

let colors: number[] = [];

for (const c of faceColors) {
  // Repeat each color four times for the four vertices of the face
  colors = colors.concat(c, c, c, c);
}

const CUBE_COLORS = new Float32Array(colors);

// prettier-ignore
const CUBE_INDICES = new Uint16Array([
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
]);

export class Cube implements Drawable {
  readonly position: Vec3;
  private readonly gl: WebGL2RenderingContext;
  private readonly modelMatrix: Mat4 = mat4.create();
  private readonly viewMatrix: Mat4 = mat4.create();
  private readonly projectionMatrix: Mat4 = mat4.create();
  private readonly projectionViewMatrix: Mat4 = mat4.create();

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
    projectionViewMatrix: WebGLUniformLocation;
  };

  constructor(gl: WebGL2RenderingContext, position: Vec3) {
    this.gl = gl;
    this.position = position;

    this.shaderProgram = this.initShaders();

    this.attribLocations = {
      position: getAttribLocation(this.gl, this.shaderProgram, "vertexPosition"),
      color: getAttribLocation(this.gl, this.shaderProgram, "vertexColor"),
    };

    mat4.lookAt(
      this.viewMatrix,
      /* eye position     */ [0, 0, 2],
      /* look at position */ [0, 0, 0],
      /* up vector        */ [0, 1, 0]
    );
    mat4.perspective(
      this.projectionMatrix,
      /* field of view    */ glMatrix.toRadian(80),
      /* aspect ratio     */ window.innerWidth / window.innerHeight,
      /* near plane       */ 0.1,
      /* far plane        */ 100
    );
    mat4.multiply(this.projectionViewMatrix, this.projectionMatrix, this.viewMatrix);

    this.uniformLocations = {
      modelMatrix: getUniformLocation(this.gl, this.shaderProgram, "modelMatrix"),
      projectionViewMatrix: getUniformLocation(this.gl, this.shaderProgram, "projectionViewMatrix"),
    };

    this.positionBuffer = safeCreateBuffer(this.gl, CUBE_VERTICES);
    this.colorBuffer = safeCreateBuffer(this.gl, CUBE_COLORS);
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
    this.gl.vertexAttribPointer(this.attribLocations.color, 4, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bindVertexArray(null);
  }

  private updateModelMatrix(): void {
    mat4.identity(this.modelMatrix);
    mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
    mat4.rotate(this.modelMatrix, this.modelMatrix, Math.PI / 4, [0, 1, 1]);
    mat4.scale(this.modelMatrix, this.modelMatrix, [0.2, 0.2, 0.2]);
  }

  public draw(): void {
    this.updateModelMatrix();

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    this.gl.useProgram(this.shaderProgram);
    this.gl.bindVertexArray(this.vao);
    this.gl.uniformMatrix4fv(this.uniformLocations.modelMatrix, false, this.modelMatrix);
    this.gl.uniformMatrix4fv(
      this.uniformLocations.projectionViewMatrix,
      false,
      this.projectionViewMatrix
    );
    this.gl.drawElements(this.gl.TRIANGLES, CUBE_INDICES.length, this.gl.UNSIGNED_SHORT, 0);
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
